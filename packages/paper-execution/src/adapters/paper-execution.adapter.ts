/**
 * packages/paper-execution/src/adapters/paper-execution.adapter.ts
 * Simulates orders, fills, positions and PnL. No real funds. No exchange auth.
 */
import { v4 as uuid } from 'uuid';
import { EventEmitter } from 'events';
import { PaperWallet } from '../paper-wallet';
import { FillEngine } from '../fill-engine';
import { PnLTracker } from '../pnl-tracker';
import { TradeJournal } from '../trade-journal';
import type {
  ExecutionAdapter, PlaceOrderParams, OrderResult, PortfolioBalance,
  OpenPosition, PaperOrder, OrderStatus, TickerSnapshot, StrategySignal,
  TradeJournalEntry, SimulatedFill,
} from '@crypto-paper-bot/shared-types';

export interface PaperAdapterConfig {
  initialUsdt: number;
  feeRateTaker: number;
  slippageBps: number;
  takeProfitPct: number;
  stopLossPct: number;
}

export class PaperExecutionAdapter extends EventEmitter implements ExecutionAdapter {
  private wallet: PaperWallet;
  private fillEngine: FillEngine;
  private pnlTracker: PnLTracker;
  private journal: TradeJournal;
  private orders = new Map<string, PaperOrder>();
  private entrySignals = new Map<string, StrategySignal>();
  private entryFills = new Map<string, SimulatedFill>();
  private lastTicker: TickerSnapshot | null = null;

  constructor(private readonly config: PaperAdapterConfig) {
    super();
    this.wallet = new PaperWallet(config.initialUsdt);
    this.fillEngine = new FillEngine(config.feeRateTaker, config.slippageBps);
    this.pnlTracker = new PnLTracker();
    this.journal = new TradeJournal();
  }

  async placeOrder(params: PlaceOrderParams): Promise<OrderResult> {
    if (!this.lastTicker || this.lastTicker.symbol !== params.symbol) {
      throw new Error(`No ticker data for ${params.symbol}`);
    }
    const order = this.createOrder(params);
    this.orders.set(order.id, order);

    const fill = this.fillEngine.compute(order.id, params.side, params.quantity, this.lastTicker);

    order.status = 'filled' as OrderStatus;
    order.filledQuantity = fill.quantity;
    order.averageFillPrice = fill.fillPrice;
    order.filledAt = fill.filledAt;
    order.updatedAt = fill.filledAt;

    const [base = 'BTC'] = params.symbol.split('/');

    if (params.side === 'buy') {
      this.wallet.executeBuy(base, fill.quantity, fill.totalCost);
      const position = this.pnlTracker.openPosition(order.id, params.signalId, fill);

      // Store for journal
      this.entrySignals.set(position.id, this.makeSignalRef(params, fill));
      this.entryFills.set(position.id, fill);

      console.log(`[PaperExec] BUY  ${fill.quantity} ${params.symbol} @ ${fill.fillPrice.toFixed(2)} | fee: ${fill.feeApplied.toFixed(4)} USDT | ${params.reasonCode}`);
      this.emit('order', order);
      this.emit('fill', fill);
      this.emit('position_opened', position);
    } else {
      const openPos = this.pnlTracker.getOpenPositionForSymbol(params.symbol);
      if (!openPos) throw new Error(`No open position for ${params.symbol}`);

      const closedPos = this.pnlTracker.closePosition(openPos.id, fill, params.signalId, params.reasonCode);
      this.wallet.executeSell(base, fill.quantity, fill.totalCost);
      this.wallet.recordRealizedPnl(closedPos.realizedPnl ?? 0);

      const entrySignal = this.entrySignals.get(openPos.id);
      const entryFill = this.entryFills.get(openPos.id);

      if (entrySignal && entryFill) {
        const journalEntry = this.journal.write({
          position: closedPos,
          entryFill,
          exitFill: fill,
          entrySignal,
          exitSignal: this.makeSignalRef(params, fill),
          takeProfitTriggerPct: this.config.takeProfitPct,
          stopLossTriggerPct: this.config.stopLossPct,
        });
        this.emit('journal_entry', journalEntry);
        this.entrySignals.delete(openPos.id);
        this.entryFills.delete(openPos.id);
      }

      const pnlStr = closedPos.realizedPnl !== undefined
        ? `${closedPos.realizedPnl >= 0 ? '+' : ''}${closedPos.realizedPnl.toFixed(4)} USDT`
        : '?';
      console.log(`[PaperExec] SELL ${fill.quantity} ${params.symbol} @ ${fill.fillPrice.toFixed(2)} | PnL: ${pnlStr} | ${params.reasonCode}`);
      this.emit('order', order);
      this.emit('fill', fill);
      this.emit('position_closed', closedPos);
    }

    return { order, fill };
  }

  async cancelOrder(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    order.status = 'cancelled' as OrderStatus;
    order.cancelledAt = new Date();
    order.updatedAt = new Date();
  }

  async getBalance(): Promise<PortfolioBalance> {
    return this.wallet.getSnapshot(
      this.pnlTracker.getTotalUnrealizedPnl(),
      this.pnlTracker.getLockedValue(),
    );
  }

  async getOpenPositions(): Promise<OpenPosition[]> {
    return this.pnlTracker.getOpenPositions();
  }

  async getOpenOrders(): Promise<PaperOrder[]> {
    return [...this.orders.values()].filter(o => o.status === 'pending');
  }

  /** Called on every ticker — updates PnL and last price */
  onTicker(ticker: TickerSnapshot): OpenPosition[] {
    this.lastTicker = ticker;
    this.wallet.updateTickerPrice(ticker.symbol, ticker.midPrice);
    const updated = this.pnlTracker.onTicker(ticker);
    if (updated.length > 0) this.emit('positions_updated', updated);
    return updated;
  }

  getJournalEntries(): TradeJournalEntry[] { return this.journal.getAll(); }
  getJournalSummary() { return this.journal.getSummary(); }
  getAllOrders(): PaperOrder[] { return [...this.orders.values()]; }

  private createOrder(params: PlaceOrderParams): PaperOrder {
    const now = new Date();
    return {
      id: uuid(), signalId: params.signalId, riskDecisionId: params.riskDecisionId,
      symbol: params.symbol, side: params.side, type: params.type,
      status: 'pending' as OrderStatus,
      requestedQuantity: params.quantity, requestedPrice: params.limitPrice,
      filledQuantity: 0, averageFillPrice: 0,
      assumedFeeRate: this.config.feeRateTaker,
      assumedSlippageBps: this.config.slippageBps,
      reasonCode: params.reasonCode, notes: params.notes ?? '',
      createdAt: now, updatedAt: now,
    };
  }

  private makeSignalRef(params: PlaceOrderParams, fill: SimulatedFill): StrategySignal {
    return {
      id: params.signalId, strategyId: 'external', symbol: params.symbol,
      timestamp: new Date(), action: params.side === 'buy' ? 'buy' : 'close',
      confidence: 1, reasonCode: params.reasonCode,
      reasonDetail: params.notes ?? params.reasonCode,
      referencePrice: fill.fillPrice,
      indicatorSnapshot: {}, ttlMs: 0, expiresAt: new Date(),
    };
  }
}

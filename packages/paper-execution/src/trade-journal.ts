/**
 * packages/paper-execution/src/trade-journal.ts
 * Writes and stores complete trade journal entries for every closed position.
 */
import { v4 as uuid } from 'uuid';
import type {
  TradeJournalEntry, OpenPosition, SimulatedFill,
  StrategySignal, SignalReasonCode,
} from '@crypto-paper-bot/shared-types';

export class TradeJournal {
  private entries: TradeJournalEntry[] = [];

  write(params: {
    position: OpenPosition;
    entryFill: SimulatedFill;
    exitFill: SimulatedFill;
    entrySignal: StrategySignal;
    exitSignal: StrategySignal;
    takeProfitTriggerPct: number;
    stopLossTriggerPct: number;
    notes?: string;
  }): TradeJournalEntry {
    const {
      position, entryFill, exitFill,
      entrySignal, exitSignal,
      takeProfitTriggerPct, stopLossTriggerPct,
    } = params;

    const grossPnl = (exitFill.fillPrice - entryFill.fillPrice) * position.quantity;
    const totalFees = entryFill.feeApplied + exitFill.feeApplied;
    const netPnl = grossPnl - totalFees;
    const netPnlPct = (netPnl / (entryFill.fillPrice * position.quantity)) * 100;
    const openedAt = position.openedAt;
    const closedAt = position.closedAt ?? new Date();
    const durationMs = closedAt.getTime() - openedAt.getTime();

    const outcome: TradeJournalEntry['outcome'] =
      netPnl > 0.01 ? 'win' : netPnl < -0.01 ? 'loss' : 'breakeven';

    const entry: TradeJournalEntry = {
      id: uuid(),
      positionId: position.id,
      entryOrderId: position.entryOrderId,
      exitOrderId: exitFill.orderId,
      symbol: position.symbol,
      side: 'long',

      entrySignalId: entrySignal.id,
      entrySignalReasonCode: entrySignal.reasonCode,
      entrySignalReasonDetail: entrySignal.reasonDetail,
      exitSignalId: exitSignal.id,
      exitSignalReasonCode: exitSignal.reasonCode as SignalReasonCode,
      exitSignalReasonDetail: exitSignal.reasonDetail,

      entryPrice: entryFill.fillPrice,
      exitPrice: exitFill.fillPrice,
      takeProfitTriggerPct,
      stopLossTriggerPct,

      quantity: position.quantity,
      entryFeeUsdt: entryFill.feeApplied,
      exitFeeUsdt: exitFill.feeApplied,
      totalFeesUsdt: totalFees,

      assumedSlippageBps: Math.round((entryFill.slippageApplied / entryFill.midPriceAtFill) * 10_000),
      estimatedSlippageCost: entryFill.slippageApplied * position.quantity + exitFill.slippageApplied * position.quantity,

      grossPnlUsdt: grossPnl,
      netPnlUsdt: netPnl,
      netPnlPct,

      openedAt,
      closedAt,
      durationMs,
      outcome,

      notes: params.notes ?? '',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.entries.push(entry);
    console.log(
      `[Journal] ${outcome?.toUpperCase()} | ${entry.symbol} | ` +
      `PnL: ${netPnl >= 0 ? '+' : ''}${netPnl.toFixed(4)} USDT (${netPnlPct.toFixed(2)}%) | ` +
      `Reason: ${exitSignal.reasonCode}`
    );
    return entry;
  }

  getAll(): TradeJournalEntry[] { return [...this.entries]; }

  getBySymbol(symbol: string): TradeJournalEntry[] {
    return this.entries.filter(e => e.symbol === symbol);
  }

  getSummary() {
    const closed = this.entries.filter(e => e.outcome !== 'open');
    const wins = closed.filter(e => e.outcome === 'win');
    const losses = closed.filter(e => e.outcome === 'loss');
    const totalNet = closed.reduce((s, e) => s + (e.netPnlUsdt ?? 0), 0);
    return {
      total: closed.length,
      wins: wins.length,
      losses: losses.length,
      winRate: closed.length > 0 ? wins.length / closed.length : 0,
      totalNetPnl: totalNet,
    };
  }
}

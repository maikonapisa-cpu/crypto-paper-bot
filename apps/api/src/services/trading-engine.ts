/**
 * apps/api/src/services/trading-engine.ts
 *
 * The central orchestrator. Wires market data → strategy → risk → execution.
 * This is the Milestone 1 loop in code form.
 */
import { EventEmitter } from 'events';
import { BinancePublicAdapter } from '@crypto-paper-bot/market-data';
import { DualEMACrossoverStrategy, TakeProfitMonitor } from '@crypto-paper-bot/strategy-engine';
import { RiskEngine } from '@crypto-paper-bot/risk-engine';
import { PaperExecutionAdapter } from '@crypto-paper-bot/paper-execution';
import { computeMetrics } from '@crypto-paper-bot/analytics';
import type {
  AppConfig, TickerSnapshot, Candle, OpenPosition,
  SystemHealthEvent, TradeJournalEntry, PerformanceMetricSnapshot,
} from '@crypto-paper-bot/shared-types';

export class TradingEngine extends EventEmitter {
  private adapter: BinancePublicAdapter;
  private strategy: DualEMACrossoverStrategy;
  private tpMonitor: TakeProfitMonitor;
  private riskEngine: RiskEngine;
  private execution: PaperExecutionAdapter;

  private latestTicker: TickerSnapshot | null = null;
  private latestCandles: Candle[] = [];
  private peakEquity: number;
  private metricsTimer: NodeJS.Timeout | null = null;

  constructor(private readonly config: AppConfig) {
    super();
    this.peakEquity = config.paperWalletInitialUsdt;

    this.adapter = new BinancePublicAdapter({
      wsUrl: process.env['EXCHANGE_WS_URL'],
      restUrl: process.env['EXCHANGE_REST_URL'],
      staleTresholdMs: config.risk.staleDateThresholdMs,
    });

    this.strategy = new DualEMACrossoverStrategy({
      fastPeriod: Number(process.env['EMA_FAST_PERIOD'] ?? 9),
      slowPeriod: Number(process.env['EMA_SLOW_PERIOD'] ?? 21),
      takeProfitPct: config.strategyTakeProfitPct,
      stopLossPct: config.strategyStopLossPct,
    });

    this.tpMonitor = new TakeProfitMonitor(
      config.strategyTakeProfitPct,
      config.strategyStopLossPct,
    );

    this.riskEngine = new RiskEngine(config.risk);

    this.execution = new PaperExecutionAdapter({
      initialUsdt: config.paperWalletInitialUsdt,
      feeRateTaker: config.paperFeeRateTaker,
      slippageBps: config.paperSlippageBps,
      takeProfitPct: config.strategyTakeProfitPct,
      stopLossPct: config.strategyStopLossPct,
    });
  }

  async start(): Promise<void> {
    console.log('⚠️  PAPER TRADING ONLY — NOT CONNECTED TO LIVE FUNDS');
    console.log(`[Engine] Starting on pair: ${this.config.strategyDefaultPair}`);

    const pair = this.config.strategyDefaultPair; // e.g. "BTC/USDT"
    const sourceSymbol = pair.replace('/', ''); // "BTCUSDT"

    // Subscribe to streams
    this.adapter.subscribeTicker(sourceSymbol);
    this.adapter.subscribeCandles(sourceSymbol, '1m');
    this.adapter.subscribeOrderBook(sourceSymbol, 10);
    this.adapter.subscribeRecentTrades(sourceSymbol);

    // Seed strategy with recent candles before going live
    try {
      console.log(`[Engine] Seeding strategy with historical candles...`);
      const historical = await this.adapter.fetchCandles(sourceSymbol, '1m', 100);
      for (const candle of historical) {
        this.strategy.onCandle(candle, await this.getStrategyState());
        this.latestCandles.push(candle);
      }
      if (this.latestCandles.length > 200) this.latestCandles = this.latestCandles.slice(-200);
      console.log(`[Engine] Seeded with ${historical.length} candles`);
    } catch (e) {
      console.warn('[Engine] Could not seed candles (offline?). Starting cold.');
    }

    // Wire event handlers
    this.adapter.onTicker(ticker => this.handleTicker(ticker));
    this.adapter.onCandle(candle => this.handleCandle(candle));
    this.adapter.onOrderBook(ob => this.emit('orderbook', ob));
    this.adapter.onTrade(trade => this.emit('trade', trade));
    this.adapter.onHealthEvent(event => this.handleHealth(event));

    // Forward execution events to API clients
    this.execution.on('order', o => this.emit('order', o));
    this.execution.on('fill', f => this.emit('fill', f));
    this.execution.on('position_opened', p => this.emit('position_opened', p));
    this.execution.on('position_closed', p => this.emit('position_closed', p));
    this.execution.on('positions_updated', ps => this.emit('positions_updated', ps));
    this.execution.on('journal_entry', j => this.emit('journal_entry', j));

    await this.adapter.connect();
    console.log('[Engine] Connected to market data feed');

    // Periodic metrics snapshot every 5 minutes
    this.metricsTimer = setInterval(() => this.emitMetrics(), 5 * 60 * 1000);
  }

  async stop(): Promise<void> {
    if (this.metricsTimer) clearInterval(this.metricsTimer);
    await this.adapter.disconnect();
    console.log('[Engine] Stopped');
  }

  // ---- Event handlers --------------------------------------

  private async handleTicker(ticker: TickerSnapshot): Promise<void> {
    this.latestTicker = ticker;
    this.emit('ticker', ticker);

    // Update execution layer PnL
    this.execution.onTicker(ticker);

    // Check take-profit / stop-loss on open positions
    const openPositions = await this.execution.getOpenPositions();
    const tpSignals = this.tpMonitor.check(ticker, openPositions);

    for (const signal of tpSignals) {
      const portfolio = await this.execution.getBalance();
      const decision = await this.riskEngine.evaluate(signal, portfolio, openPositions);
      this.emit('risk_decision', decision);

      if (decision.outcome === 'approved') {
        try {
          await this.execution.placeOrder({
            signalId: signal.id,
            riskDecisionId: decision.id,
            symbol: signal.symbol,
            side: 'sell',
            type: 'market',
            quantity: openPositions.find(p => p.symbol === signal.symbol)?.quantity ?? 0,
            reasonCode: signal.reasonCode,
            notes: signal.reasonDetail,
          });
          const bal = await this.execution.getBalance();
          if (bal.totalEquityUsdt > this.peakEquity) this.peakEquity = bal.totalEquityUsdt;
          this.emit('portfolio', bal);
        } catch (err) {
          console.error('[Engine] Take-profit order failed:', err);
        }
      }
    }
  }

  private async handleCandle(candle: Candle): Promise<void> {
    if (candle.isClosed) {
      this.latestCandles.push(candle);
      if (this.latestCandles.length > 200) this.latestCandles.shift();
    }
    this.emit('candle', candle);

    const state = await this.getStrategyState();
    const signal = this.strategy.onCandle(candle, state);
    if (!signal || signal.action === 'hold') return;

    this.emit('signal', signal);
    console.log(`[Strategy] Signal: ${signal.action.toUpperCase()} ${signal.symbol} | ${signal.reasonCode}`);

    const portfolio = await this.execution.getBalance();
    const openPositions = await this.execution.getOpenPositions();
    const decision = await this.riskEngine.evaluate(signal, portfolio, openPositions);
    this.emit('risk_decision', decision);

    if (decision.outcome !== 'approved') return;

    // Compute position size: use allowed size from risk engine
    const allowedUsdt = decision.positionSizeAllowed ?? 0;
    if (allowedUsdt < 1) return;

    const qty = this.computeQuantity(signal.action, allowedUsdt, candle.close, openPositions, signal.symbol);
    if (qty <= 0) return;

    try {
      await this.execution.placeOrder({
        signalId: signal.id,
        riskDecisionId: decision.id,
        symbol: signal.symbol,
        side: signal.action === 'buy' ? 'buy' : 'sell',
        type: 'market',
        quantity: qty,
        reasonCode: signal.reasonCode,
        notes: signal.reasonDetail,
      });
      const bal = await this.execution.getBalance();
      if (bal.totalEquityUsdt > this.peakEquity) this.peakEquity = bal.totalEquityUsdt;
      this.emit('portfolio', bal);
    } catch (err) {
      console.error('[Engine] Order placement failed:', err);
    }
  }

  private handleHealth(event: SystemHealthEvent): void {
    this.riskEngine.updateAdapterHealth(this.adapter.getHealth());
    this.emit('health', event);
    console.log(`[Health] [${event.severity.toUpperCase()}] ${event.detail}`);
  }

  // ---- Helpers ---------------------------------------------

  private computeQuantity(
    action: string,
    allowedUsdt: number,
    price: number,
    openPositions: OpenPosition[],
    symbol: string,
  ): number {
    if (action === 'buy') {
      return parseFloat((allowedUsdt / price).toFixed(6));
    }
    // sell: use position quantity
    const pos = openPositions.find(p => p.symbol === symbol && p.status === 'open');
    return pos?.quantity ?? 0;
  }

  private async getStrategyState() {
    const [portfolio, openPositions] = await Promise.all([
      this.execution.getBalance(),
      this.execution.getOpenPositions(),
    ]);
    return { openPositions, portfolioBalance: portfolio, recentSignals: [] };
  }

  private async emitMetrics(): Promise<void> {
    const [portfolio, journal] = await Promise.all([
      this.execution.getBalance(),
      Promise.resolve(this.execution.getJournalEntries()),
    ]);
    const metrics = computeMetrics(
      journal,
      this.config.paperWalletInitialUsdt,
      portfolio.totalEquityUsdt,
      this.peakEquity,
    );
    this.emit('metrics', metrics);
  }

  // ---- Public accessors ------------------------------------

  async getPortfolio() { return this.execution.getBalance(); }
  async getPositions() { return this.execution.getOpenPositions(); }
  async getOrders() { return this.execution.getAllOrders(); }
  getJournal(): TradeJournalEntry[] { return this.execution.getJournalEntries(); }
  getJournalSummary() { return this.execution.getJournalSummary(); }
  getLatestTicker() { return this.latestTicker; }
  getLatestCandles() { return this.latestCandles.slice(-100); }
  getAdapterHealth() { return this.adapter.getHealth(); }
  getRiskStatus() { return this.riskEngine.getStatus(); }
  getStrategyConfig() { return this.strategy.getConfig(); }

  activateKillSwitch(reason: string) { this.riskEngine.activateKillSwitch(reason); }
  deactivateKillSwitch() { this.riskEngine.deactivateKillSwitch(); }

  async getMetrics(): Promise<PerformanceMetricSnapshot> {
    const portfolio = await this.execution.getBalance();
    return computeMetrics(
      this.execution.getJournalEntries(),
      this.config.paperWalletInitialUsdt,
      portfolio.totalEquityUsdt,
      this.peakEquity,
    );
  }
}

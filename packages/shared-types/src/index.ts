// ============================================================
// packages/shared-types/src/index.ts
//
// SINGLE SOURCE OF TRUTH for all domain interfaces.
// All packages and apps import types from here only.
// ============================================================

// ---- Primitives -------------------------------------------

export type CandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export type OrderSide = 'buy' | 'sell';

export type PositionSide = 'long' | 'short';

export type OrderType = 'market' | 'limit';

export type OrderStatus =
  | 'pending'
  | 'partially_filled'
  | 'filled'
  | 'cancelled'
  | 'rejected';

export type TradeOutcome = 'win' | 'loss' | 'breakeven' | 'open';

export type SystemComponent =
  | 'market-data'
  | 'strategy-engine'
  | 'paper-execution'
  | 'risk-engine'
  | 'analytics'
  | 'api-server'
  | 'database'
  | 'websocket';

export type HealthSeverity = 'info' | 'warning' | 'error' | 'critical';

export type HealthEventType =
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'RECONNECTING'
  | 'STALE_DATA_DETECTED'
  | 'KILL_SWITCH_ACTIVATED'
  | 'KILL_SWITCH_CLEARED'
  | 'STRATEGY_ERROR'
  | 'RISK_VETO'
  | 'DATABASE_ERROR'
  | 'STARTUP'
  | 'SHUTDOWN';

export type SignalReasonCode =
  | 'EMA_CROSSOVER_BULLISH'
  | 'EMA_CROSSOVER_BEARISH'
  | 'RSI_OVERSOLD'
  | 'RSI_OVERBOUGHT'
  | 'TAKE_PROFIT_HIT'
  | 'STOP_LOSS_HIT'
  | 'MANUAL_CLOSE'
  | 'RISK_VETO_CLOSE'
  | 'STRATEGY_CUSTOM';

export type RiskVetoReason =
  | 'MAX_POSITIONS_REACHED'
  | 'MAX_POSITION_SIZE_EXCEEDED'
  | 'DAILY_LOSS_LIMIT_REACHED'
  | 'COOLDOWN_ACTIVE'
  | 'STALE_MARKET_DATA'
  | 'ABNORMAL_VOLATILITY'
  | 'INSUFFICIENT_BALANCE'
  | 'KILL_SWITCH_ACTIVE';

export type SignalAction = 'buy' | 'sell' | 'hold' | 'close';

// ---- Market Data ------------------------------------------

export interface TradingPair {
  id: string;
  symbol: string;         // Normalized: "BTC/USDT"
  sourceSymbol: string;   // Exchange native: "BTCUSDT"
  baseAsset: string;
  quoteAsset: string;
  exchange: string;
  minOrderSize: number;
  tickSize: number;
  stepSize: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TickerSnapshot {
  id: string;
  symbol: string;
  sourceSymbol: string;
  exchange: string;
  timestamp: Date;
  receivedAt: Date;
  bidPrice: number;
  askPrice: number;
  lastPrice: number;
  volume24h: number;
  priceChange24h: number;
  priceChangePct24h: number;
  high24h: number;
  low24h: number;
  /** Derived convenience field */
  midPrice: number;
}

export interface Candle {
  id: string;
  symbol: string;
  exchange: string;
  openTime: Date;
  closeTime: Date;
  interval: CandleInterval;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  tradeCount: number;
  isClosed: boolean;
  receivedAt: Date;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
}

export interface OrderBookSnapshot {
  id: string;
  symbol: string;
  exchange: string;
  timestamp: Date;
  receivedAt: Date;
  bids: OrderBookLevel[];   // Sorted descending by price
  asks: OrderBookLevel[];   // Sorted ascending by price
  depth: number;
}

export interface MarketTrade {
  id: string;
  symbol: string;
  exchange: string;
  timestamp: Date;
  receivedAt: Date;
  price: number;
  quantity: number;
  side: OrderSide;
  tradeId: string;
}

// ---- Market Data Adapter Interface ------------------------

export interface AdapterHealth {
  connected: boolean;
  lastMessageAt: Date | null;
  reconnectCount: number;
  isStale: boolean;
  staleSince: Date | null;
}

export interface ExchangeAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribeTicker(symbol: string): void;
  subscribeCandles(symbol: string, interval: CandleInterval): void;
  subscribeOrderBook(symbol: string, depth?: number): void;
  subscribeRecentTrades(symbol: string): void;
  onTicker(cb: (t: TickerSnapshot) => void): void;
  onCandle(cb: (c: Candle) => void): void;
  onOrderBook(cb: (ob: OrderBookSnapshot) => void): void;
  onTrade(cb: (t: MarketTrade) => void): void;
  onHealthEvent(cb: (e: SystemHealthEvent) => void): void;
  getHealth(): AdapterHealth;
}

// ---- Strategy --------------------------------------------

export interface StrategyConfig {
  strategyId: string;
  name: string;
  description: string;
  params: Record<string, number | string | boolean>;
  takeProfitPct: number;
  stopLossPct: number;   // 0 = disabled
}

export interface StrategyState {
  openPositions: OpenPosition[];
  portfolioBalance: PortfolioBalance;
  recentSignals: StrategySignal[];
}

export interface StrategySignal {
  id: string;
  strategyId: string;
  symbol: string;
  timestamp: Date;
  action: SignalAction;
  confidence: number;                          // 0.0 - 1.0
  reasonCode: SignalReasonCode;
  reasonDetail: string;
  referencePrice: number;
  indicatorSnapshot: Record<string, number>;
  ttlMs: number;
  expiresAt: Date;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  getConfig(): StrategyConfig;
  onCandle(candle: Candle, state: StrategyState): StrategySignal | null;
  onTicker(ticker: TickerSnapshot, state: StrategyState): StrategySignal | null;
  reset(): void;
}

// ---- Risk Engine -----------------------------------------

export interface RiskCheck {
  checkName: string;
  passed: boolean;
  value?: number;
  threshold?: number;
  detail?: string;
}

export interface RiskDecision {
  id: string;
  signalId: string;
  timestamp: Date;
  outcome: 'approved' | 'vetoed';
  vetoReason?: RiskVetoReason;
  vetoDetail?: string;
  checksPerformed: RiskCheck[];
  positionSizeAllowed?: number;
}

export interface RiskEngineConfig {
  maxConcurrentPositions: number;
  maxPositionSizePct: number;     // % of total portfolio per position
  maxDailyLossPct: number;        // Circuit breaker
  cooldownPeriodSec: number;      // Per pair
  staleDateThresholdMs: number;
  abnormalVolatilityEnabled: boolean;
  abnormalVolatilityThresholdPct: number;
}

// ---- Execution -------------------------------------------

export interface PlaceOrderParams {
  signalId: string;
  riskDecisionId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  limitPrice?: number;
  reasonCode: SignalReasonCode;
  notes?: string;
}

export interface OrderResult {
  order: PaperOrder;
  fill: SimulatedFill;
}

export interface ExecutionAdapter {
  placeOrder(params: PlaceOrderParams): Promise<OrderResult>;
  cancelOrder(orderId: string): Promise<void>;
  getBalance(): Promise<PortfolioBalance>;
  getOpenPositions(): Promise<OpenPosition[]>;
  getOpenOrders(): Promise<PaperOrder[]>;
}

export interface PaperOrder {
  id: string;
  signalId: string;
  riskDecisionId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  requestedQuantity: number;
  requestedPrice?: number;
  filledQuantity: number;
  averageFillPrice: number;
  assumedFeeRate: number;
  assumedSlippageBps: number;
  reasonCode: SignalReasonCode;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  filledAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
}

export interface SimulatedFill {
  id: string;
  orderId: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  fillPrice: number;
  midPriceAtFill: number;
  slippageApplied: number;
  feeApplied: number;
  feeRate: number;
  totalCost: number;
  filledAt: Date;
}

// ---- Positions and Portfolio ------------------------------

export interface OpenPosition {
  id: string;
  symbol: string;
  side: PositionSide;
  entryOrderId: string;
  status: 'open' | 'closed';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  totalFeesPaid: number;
  openedAt: Date;
  closedAt?: Date;
  exitPrice?: number;
  realizedPnl?: number;
  closedBySignalId?: string;
  closedByReason?: string;
}

export interface AssetBalance {
  asset: string;
  free: number;
  locked: number;
  totalUsdt: number;
}

export interface PortfolioBalance {
  id: string;
  snapshotAt: Date;
  totalEquityUsdt: number;
  availableUsdt: number;
  lockedInPositions: number;
  unrealizedPnl: number;
  realizedPnlSession: number;
  realizedPnlAllTime: number;
  assets: AssetBalance[];
  initialBalance: number;
  returnPct: number;
}

// ---- Trade Journal ----------------------------------------

export interface TradeJournalEntry {
  id: string;
  positionId: string;
  entryOrderId: string;
  exitOrderId?: string;
  symbol: string;
  side: PositionSide;

  entrySignalId: string;
  entrySignalReasonCode: SignalReasonCode;
  entrySignalReasonDetail: string;
  exitSignalId?: string;
  exitSignalReasonCode?: SignalReasonCode;
  exitSignalReasonDetail?: string;

  entryPrice: number;
  exitPrice?: number;
  takeProfitTriggerPct: number;
  stopLossTriggerPct: number;

  quantity: number;
  entryFeeUsdt: number;
  exitFeeUsdt: number;
  totalFeesUsdt: number;

  assumedSlippageBps: number;
  estimatedSlippageCost: number;

  grossPnlUsdt?: number;
  netPnlUsdt?: number;
  netPnlPct?: number;

  openedAt: Date;
  closedAt?: Date;
  durationMs?: number;

  outcome?: TradeOutcome;

  notes: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ---- Analytics -------------------------------------------

export interface PerformanceMetricSnapshot {
  id: string;
  snapshotAt: Date;
  periodStart: Date;
  periodEnd: Date;
  symbol?: string;

  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  openTrades: number;

  winRate: number;
  averageReturnPct: number;
  averageWinPct: number;
  averageLossPct: number;
  profitFactor: number;

  maxDrawdownPct: number;
  maxDrawdownUsdt: number;
  sharpeRatio?: number;

  averageTradeDurationMs: number;
  takeProfitHitRate: number;

  totalNetPnlUsdt: number;
  totalFeesUsdt: number;

  startEquityUsdt: number;
  endEquityUsdt: number;
  peakEquityUsdt: number;
}

// ---- System Health ----------------------------------------

export interface SystemHealthEvent {
  id: string;
  timestamp: Date;
  component: SystemComponent;
  severity: HealthSeverity;
  eventType: HealthEventType;
  detail: string;
  metadata?: Record<string, unknown>;
  resolvedAt?: Date;
}

// ---- WebSocket API Events (dashboard ↔ api) ---------------

export type WsEventType =
  | 'ticker'
  | 'candle'
  | 'orderbook'
  | 'trade'
  | 'position_update'
  | 'order_update'
  | 'portfolio_update'
  | 'signal'
  | 'risk_decision'
  | 'health_event'
  | 'analytics_update';

export interface WsEvent<T = unknown> {
  type: WsEventType;
  timestamp: Date;
  payload: T;
}

// ---- Config (runtime, not secrets) -----------------------

export interface AppConfig {
  mode: 'paper';           // 'live' intentionally excluded
  exchange: string;
  paperWalletInitialUsdt: number;
  paperFeeRateMaker: number;
  paperFeeRateTaker: number;
  paperSlippageBps: number;
  strategyTakeProfitPct: number;
  strategyStopLossPct: number;
  strategyDefaultPair: string;
  risk: RiskEngineConfig;
}

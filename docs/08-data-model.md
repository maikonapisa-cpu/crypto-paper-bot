# 08 — Data Model

## Overview

All internal schemas are defined in `packages/shared-types/src/`. This document specifies every domain object, its fields, and its purpose. The TypeScript definitions in `shared-types` are the authoritative source of truth.

---

## Trading Pair

```typescript
interface TradingPair {
  symbol: string;           // Internal normalized symbol, e.g. "BTC/USDT"
  sourceSymbol: string;     // Exchange-native symbol, e.g. "BTCUSDT"
  baseAsset: string;        // e.g. "BTC"
  quoteAsset: string;       // e.g. "USDT"
  exchange: string;         // e.g. "binance-public"
  minOrderSize: number;     // Minimum order quantity
  tickSize: number;         // Price precision step
  stepSize: number;         // Quantity precision step
  isActive: boolean;
}
```

---

## Ticker Snapshot

```typescript
interface TickerSnapshot {
  id: string;               // UUID
  symbol: string;           // Normalized pair symbol
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
}
```

---

## Candle (OHLCV)

```typescript
interface Candle {
  id: string;
  symbol: string;
  exchange: string;
  openTime: Date;
  closeTime: Date;
  interval: CandleInterval;  // '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  tradeCount: number;
  isClosed: boolean;         // false if candle is still forming
  receivedAt: Date;
}
```

---

## Order Book Snapshot

```typescript
interface OrderBookSnapshot {
  id: string;
  symbol: string;
  exchange: string;
  timestamp: Date;
  receivedAt: Date;
  bids: OrderBookLevel[];    // Sorted descending by price
  asks: OrderBookLevel[];    // Sorted ascending by price
  depth: number;             // Number of levels captured
}

interface OrderBookLevel {
  price: number;
  quantity: number;
}
```

---

## Market Trade

```typescript
interface MarketTrade {
  id: string;
  symbol: string;
  exchange: string;
  timestamp: Date;
  receivedAt: Date;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  tradeId: string;           // Exchange-assigned trade ID
}
```

---

## Strategy Signal

```typescript
interface StrategySignal {
  id: string;                // UUID
  strategyId: string;        // Strategy class name or config ID
  symbol: string;
  timestamp: Date;
  action: 'buy' | 'sell' | 'hold' | 'close';
  confidence: number;        // 0.0 - 1.0 (informational only, not a guarantee)
  reasonCode: SignalReasonCode;
  reasonDetail: string;      // Human-readable explanation
  referencePrice: number;    // Price at signal generation time
  indicatorSnapshot: Record<string, number>;  // Indicator values at signal time
  ttlMs: number;             // Signal expires after this many ms
  expiresAt: Date;
}

type SignalReasonCode =
  | 'EMA_CROSSOVER_BULLISH'
  | 'EMA_CROSSOVER_BEARISH'
  | 'RSI_OVERSOLD'
  | 'RSI_OVERBOUGHT'
  | 'TAKE_PROFIT_HIT'
  | 'STOP_LOSS_HIT'
  | 'MANUAL_CLOSE'
  | 'RISK_VETO_CLOSE'
  | 'STRATEGY_CUSTOM';
```

---

## Risk Decision

```typescript
interface RiskDecision {
  id: string;
  signalId: string;          // References StrategySignal.id
  timestamp: Date;
  outcome: 'approved' | 'vetoed';
  vetoReason?: RiskVetoReason;
  vetoDetail?: string;
  checksPerformed: RiskCheck[];
  positionSizeAllowed?: number;  // Computed allowed size (if approved)
}

type RiskVetoReason =
  | 'MAX_POSITIONS_REACHED'
  | 'MAX_POSITION_SIZE_EXCEEDED'
  | 'DAILY_LOSS_LIMIT_REACHED'
  | 'COOLDOWN_ACTIVE'
  | 'STALE_MARKET_DATA'
  | 'ABNORMAL_VOLATILITY'
  | 'INSUFFICIENT_BALANCE'
  | 'KILL_SWITCH_ACTIVE';

interface RiskCheck {
  checkName: string;
  passed: boolean;
  value?: number;
  threshold?: number;
  detail?: string;
}
```

---

## Paper Order

```typescript
interface PaperOrder {
  id: string;               // UUID
  signalId: string;
  riskDecisionId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  status: PaperOrderStatus;
  requestedQuantity: number;
  requestedPrice?: number;  // For limit orders
  filledQuantity: number;
  averageFillPrice: number;
  createdAt: Date;
  updatedAt: Date;
  filledAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  reasonCode: SignalReasonCode;
  notes: string;
  // Simulation metadata
  assumedFeeRate: number;
  assumedSlippageBps: number;
}

type PaperOrderStatus =
  | 'pending'
  | 'partially_filled'
  | 'filled'
  | 'cancelled'
  | 'rejected';
```

---

## Simulated Fill

```typescript
interface SimulatedFill {
  id: string;
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  fillPrice: number;
  midPriceAtFill: number;   // For audit — what mid-price was used
  slippageApplied: number;  // Absolute price adjustment from slippage
  feeApplied: number;       // Fee in quote asset
  feeRate: number;
  filledAt: Date;
  totalCost: number;        // quantity * fillPrice + feeApplied
}
```

---

## Open Position

```typescript
interface OpenPosition {
  id: string;
  symbol: string;
  side: 'long' | 'short';   // v1: long only
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
```

---

## Portfolio Balance

```typescript
interface PortfolioBalance {
  id: string;
  snapshotAt: Date;
  totalEquityUsdt: number;   // Total portfolio value in USDT
  availableUsdt: number;     // USDT not locked in positions
  lockedInPositions: number; // USDT value locked in open positions
  unrealizedPnl: number;
  realizedPnlSession: number;  // PnL since bot start
  realizedPnlAllTime: number;
  assets: AssetBalance[];
  initialBalance: number;    // What we started with
  returnPct: number;         // (totalEquity - initial) / initial * 100
}

interface AssetBalance {
  asset: string;             // e.g. "BTC", "USDT"
  free: number;
  locked: number;
  totalUsdt: number;         // Estimated USD value
}
```

---

## Trade Journal Entry

```typescript
interface TradeJournalEntry {
  id: string;
  positionId: string;
  entryOrderId: string;
  exitOrderId?: string;
  symbol: string;
  side: 'long' | 'short';

  // Signal
  entrySignalId: string;
  entrySignalReasonCode: SignalReasonCode;
  entrySignalReasonDetail: string;
  exitSignalId?: string;
  exitSignalReasonCode?: SignalReasonCode;
  exitSignalReasonDetail?: string;

  // Prices
  entryPrice: number;
  exitPrice?: number;
  takeProfitTriggerPct: number;  // e.g. 5.0
  stopLossTriggerPct: number;    // 0 = disabled

  // Quantities and costs
  quantity: number;
  entryFeeUsdt: number;
  exitFeeUsdt: number;
  totalFeesUsdt: number;

  // Slippage
  assumedSlippageBps: number;
  estimatedSlippageCost: number;

  // PnL
  grossPnlUsdt: number;
  netPnlUsdt: number;           // After fees
  netPnlPct: number;

  // Timing
  openedAt: Date;
  closedAt?: Date;
  durationMs?: number;

  // Outcome
  outcome?: 'win' | 'loss' | 'breakeven' | 'open';

  // Audit
  notes: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Performance Metric Snapshot

```typescript
interface PerformanceMetricSnapshot {
  id: string;
  snapshotAt: Date;
  periodStart: Date;
  periodEnd: Date;
  symbol?: string;          // null = all pairs

  // Trade counts
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  openTrades: number;

  // Returns
  winRate: number;                // 0.0 - 1.0
  averageReturnPct: number;
  averageWinPct: number;
  averageLossPct: number;
  profitFactor: number;           // grossWins / grossLosses

  // Risk metrics
  maxDrawdownPct: number;
  maxDrawdownUsdt: number;
  sharpeRatio?: number;           // Optional — requires sufficient data

  // Timing
  averageTradeDurationMs: number;
  takeProfitHitRate: number;      // % of trades closed by take-profit

  // PnL
  totalNetPnlUsdt: number;
  totalFeesUsdt: number;

  // Equity
  startEquityUsdt: number;
  endEquityUsdt: number;
  peakEquityUsdt: number;
}
```

---

## System Health Event

```typescript
interface SystemHealthEvent {
  id: string;
  timestamp: Date;
  component: SystemComponent;
  severity: 'info' | 'warning' | 'error' | 'critical';
  eventType: HealthEventType;
  detail: string;
  metadata?: Record<string, unknown>;
  resolvedAt?: Date;
}

type SystemComponent =
  | 'market-data'
  | 'strategy-engine'
  | 'paper-execution'
  | 'risk-engine'
  | 'analytics'
  | 'api-server'
  | 'database'
  | 'websocket';

type HealthEventType =
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
```

---

## Database Tables Summary

| Table | Description |
|-------|-------------|
| `trading_pairs` | Supported pairs and their metadata |
| `ticker_snapshots` | Periodic ticker snapshots |
| `candles` | OHLCV candle data |
| `order_book_snapshots` | Periodic order book snapshots |
| `market_trades` | Recent trade feed |
| `strategy_signals` | All generated signals with reason codes |
| `risk_decisions` | Risk check results for every signal |
| `paper_orders` | All simulated orders |
| `simulated_fills` | All simulated fills |
| `open_positions` | Current open positions |
| `portfolio_balance_snapshots` | Periodic balance snapshots |
| `trade_journal` | Complete trade journal |
| `performance_snapshots` | Computed metrics over time |
| `system_health_events` | System health log |

See `database/schema.sql` for the full DDL.

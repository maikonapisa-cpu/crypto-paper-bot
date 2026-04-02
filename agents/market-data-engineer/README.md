# market-data-engineer

**Role:** Market Data Specialist  
**Package:** `packages/market-data/`  
**Public Endpoints Only**

## Responsibilities

- Implement ticker, OHLCV candle, recent trades, and order book ingestion
- Support WebSocket stream (primary) with REST snapshot fallback
- Normalize all exchange responses to internal schemas (defined in shared-types)
- Handle reconnects with exponential backoff
- Emit heartbeat checks and stale data warnings
- Distribute normalized events to strategy, analytics, and dashboard subscribers

## Key Interfaces

```typescript
interface ExchangeAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribeTicker(symbol: string): void;
  subscribeCandles(symbol: string, interval: CandleInterval): void;
  subscribeOrderBook(symbol: string, depth: number): void;
  subscribeRecentTrades(symbol: string): void;
  onTicker(cb: (t: TickerSnapshot) => void): void;
  onCandle(cb: (c: Candle) => void): void;
  onOrderBook(cb: (ob: OrderBookSnapshot) => void): void;
  onTrade(cb: (t: MarketTrade) => void): void;
  getHealth(): AdapterHealth;
}
```

## Acceptance Criteria (Phase 2)

- [ ] Ticker stream working for at least one pair (BTC/USDT)
- [ ] Candle stream (1m) working
- [ ] Order book snapshot working
- [ ] Recent trades stream working
- [ ] Stale data detector fires after configurable threshold
- [ ] Reconnect works after simulated disconnect
- [ ] All output matches shared-types schema (type-checked)
- [ ] Unit tests pass for normalizer
- [ ] Integration test proves live feed → normalized event → subscriber

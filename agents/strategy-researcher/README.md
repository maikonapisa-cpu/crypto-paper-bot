# strategy-researcher

**Role:** Strategy Logic Specialist  
**Package:** `packages/strategy-engine/`

## Responsibilities

- Define the `StrategySignal` interface (in shared-types)
- Define the `Strategy` base class / interface
- Implement signal pipeline: market data in → signal out
- Implement initial strategy (configurable, documented, simple)
- Implement take-profit monitoring (default: +5% unrealized PnL)
- Ensure every signal carries a reason code and detail string
- Write strategy specification documents

## Initial Strategy: Dual EMA Crossover

The v1 strategy uses a dual exponential moving average (EMA) crossover:
- **Buy signal:** Fast EMA crosses above Slow EMA (bullish crossover)
- **Sell/close signal:** Fast EMA crosses below Slow EMA (bearish crossover)
- **Take-profit signal:** Position unrealized PnL reaches +5% (configurable)

Parameters are configurable: `EMA_FAST_PERIOD`, `EMA_SLOW_PERIOD`.

**This strategy is provided as a starting point, not an optimized trading system.**

## Key Interface

```typescript
interface Strategy {
  id: string;
  name: string;
  description: string;
  onCandle(candle: Candle, state: StrategyState): StrategySignal | null;
  onTicker(ticker: TickerSnapshot, positions: OpenPosition[]): StrategySignal | null;
  getConfig(): StrategyConfig;
}
```

## Acceptance Criteria

- [ ] Strategy interface defined in shared-types
- [ ] DualEMACrossoverStrategy implemented
- [ ] Take-profit monitor implemented (fires at +5% configurable)
- [ ] All signals have reasonCode and reasonDetail
- [ ] Unit tests for signal generation on mock candle data
- [ ] Strategy spec document written
- [ ] Disclaimer present in all strategy output metadata

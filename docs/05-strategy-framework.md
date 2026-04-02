# 05 — Strategy Framework

> **Status:** Stub — Full specification written in Phase 3 after implementation.

---

## Overview

The strategy engine is a pluggable signal pipeline. It receives market events (candles, tickers) and produces `StrategySignal` objects consumed by the risk engine.

Every strategy must:
1. Implement the `Strategy` interface
2. Produce signals with `reasonCode` and `reasonDetail`
3. Never communicate directly with the execution layer
4. Document all indicators and parameters used

---

## v1 Strategy: Dual EMA Crossover

The initial strategy uses a dual exponential moving average crossover:

- **Fast EMA period:** configurable (default: 9)
- **Slow EMA period:** configurable (default: 21)
- **Buy signal:** Fast EMA crosses above Slow EMA → `EMA_CROSSOVER_BULLISH`
- **Sell signal:** Fast EMA crosses below Slow EMA → `EMA_CROSSOVER_BEARISH`
- **Close signal:** Unrealized PnL ≥ take-profit threshold → `TAKE_PROFIT_HIT`

### Limitations (Required Disclosure)

> EMA crossover is a lagging indicator. It will not predict market tops or bottoms. In sideways or choppy markets, crossovers produce false signals ("whipsaws"). Frequent small losses from whipsawing can erode capital even with a moderate win rate. This strategy is provided as a starting point for research, not as an optimized trading system. Simulate before adjusting parameters.

---

## Signal Lifecycle

```
MarketEvent (candle/ticker)
    → Strategy.onCandle() or Strategy.onTicker()
    → StrategySignal { action, reasonCode, reasonDetail, confidence }
    → RiskEngine.evaluate(signal)
    → RiskDecision { approved | vetoed }
    → (if approved) PaperExecutionAdapter.placeOrder()
```

---

## Phase 3 Implementation Checklist

- [ ] Strategy interface in shared-types
- [ ] Strategy base class in strategy-engine
- [ ] DualEMACrossoverStrategy
- [ ] EMA indicator utility
- [ ] TakeProfitMonitor
- [ ] SignalPipeline (wires market events to strategy)
- [ ] Strategy configuration schema
- [ ] Unit tests on mock candle sequences
- [ ] Strategy spec document (full)

*This document will be expanded after Phase 3 implementation.*

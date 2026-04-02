# Strategy Specification Template

> Use this template when documenting any strategy implemented in the strategy-engine package.
> Each strategy MUST have a completed spec before being added to the system.
> strategy-researcher owns these documents. qa-verifier must confirm spec ↔ implementation alignment.

---

## Strategy Identity

| Field | Value |
|-------|-------|
| Strategy ID | `{strategyId}` (matches class name) |
| Strategy Name | `{Human-readable name}` |
| Version | `{1.0.0}` |
| Author | `{agent or contributor}` |
| Status | Draft / Review / Active / Deprecated |

---

## Summary

One paragraph describing what this strategy does, why it might work, and what market conditions it is designed for.

---

## Indicators Used

| Indicator | Parameters | Purpose |
|-----------|------------|---------|
| {EMA} | period={9} | {Fast moving average} |
| {EMA} | period={21} | {Slow moving average} |

---

## Signal Rules

### Buy Signal
**Condition:** {Describe the exact condition that generates a BUY signal}
**Reason Code:** `{EMA_CROSSOVER_BULLISH}`
**Example:** Fast EMA(9) crosses above Slow EMA(21) on a closed 1m candle

### Sell / Close Signal
**Condition:** {Describe the exact condition that generates a SELL or CLOSE signal}
**Reason Code:** `{EMA_CROSSOVER_BEARISH}`

### Take-Profit Signal
**Condition:** Unrealized PnL ≥ `takeProfitTriggerPct` (default: +5%)
**Reason Code:** `TAKE_PROFIT_HIT`
**Note:** This is a configurable rule, not a guarantee.

### Hold Signal
**Condition:** {When is no signal generated — be explicit}

---

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `EMA_FAST_PERIOD` | number | 9 | Lookback period for fast EMA |
| `EMA_SLOW_PERIOD` | number | 21 | Lookback period for slow EMA |
| `TAKE_PROFIT_PCT` | number | 5.0 | Exit trigger for unrealized PnL |

---

## Limitations and Risks

**Required section — must not be omitted.**

- {Lagging indicator — crossovers occur after the move has started}
- {Prone to whipsawing in sideways / choppy markets}
- {Does not account for volume, trend strength, or macro context}
- {Simulated results may not reflect live execution behavior}

---

## Backtesting Notes

> Add notes after running replay tests. Include period, pair, and conditions tested.
> Do not inflate results. Include both winning and losing periods.

| Period | Pair | Candle Interval | Win Rate | Net PnL | Max Drawdown |
|--------|------|-----------------|----------|---------|--------------|
| {YYYY-MM-DD to YYYY-MM-DD} | BTC/USDT | 1m | {XX%} | {±USDT} | {-%} |

---

## Implementation Reference

| Item | Location |
|------|----------|
| Strategy class | `packages/strategy-engine/src/strategies/{strategy-id}.strategy.ts` |
| Unit tests | `tests/unit/strategy-engine/{strategy-id}.test.ts` |
| Integration test | `tests/integration/milestone-1-loop.test.ts` |

---

## Disclaimer

> This strategy specification is provided for research purposes only.
> Simulated performance is not predictive of live trading results.
> This document does not constitute financial advice.
> Past signal accuracy in simulation does not guarantee future results.

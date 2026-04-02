# 09 — Testing and Metrics

> **Status:** Stub — Expanded in Phase 5 after test harness is built.

---

## Test Categories

### Unit Tests (`tests/unit/`)

Fine-grained tests for individual functions and classes with no external dependencies.

| Package | Test File | What It Tests |
|---------|-----------|---------------|
| market-data | normalizer.test.ts | Raw → internal schema conversion |
| market-data | stale-detector.test.ts | Stale threshold firing |
| strategy-engine | ema-crossover.test.ts | Signal generation on mock candles |
| strategy-engine | take-profit-monitor.test.ts | Take-profit trigger at +5% |
| risk-engine | all-checks.test.ts | Each of the 8 pre-trade checks |
| paper-execution | fill-engine.test.ts | Fill price with slippage model |
| paper-execution | pnl-tracker.test.ts | Unrealized and realized PnL |
| analytics | metrics.test.ts | All metric computations on known data |

### Integration Tests (`tests/integration/`)

End-to-end flows through multiple packages with a real (or mocked) database.

| Test | What It Proves |
|------|---------------|
| milestone-1-loop.test.ts | Full loop: data → signal → risk → fill → PnL → take-profit → journal |
| risk-veto-blocks.test.ts | Vetoed signal never reaches paper-execution |
| stale-data-circuit-breaker.test.ts | Stale data activates circuit breaker, blocks new orders |
| reconnect.test.ts | WS disconnect → reconnect → data resumes |

### Replay Tests (`tests/replay/`)

Feed historical candle data through the strategy engine and verify signal output and metrics.

| Test | What It Proves |
|------|---------------|
| known-dataset-replay.test.ts | Strategy produces expected signals on known input |
| metrics-reproducibility.test.ts | Metrics computed from journal match expected values |

---

## Milestone 1 Loop — Acceptance Test

This is the critical integration test. It must pass before Phase 3 is signed off.

```
Given: Paper wallet initialized with 10,000 USDT
And:   Market data feed producing candles for BTC/USDT
When:  Strategy generates a BUY signal (EMA crossover)
And:   Risk engine approves the signal
Then:  An order is placed and filled at mid-price + slippage
And:   Position is opened and tracked
And:   PnL updates on each ticker event
When:  Unrealized PnL reaches +5%
Then:  Take-profit signal generated
And:   Position closed, USDT credited (minus fee)
And:   Trade journal entry written with all required fields
```

---

## Phase 5 Implementation Checklist

- [ ] All unit tests written and passing
- [ ] All integration tests written and passing
- [ ] Replay tooling implemented
- [ ] Known-dataset replay test passes
- [ ] Metrics reproducibility confirmed
- [ ] qa-verifier final gate passed

*This document will be expanded after Phase 5 implementation.*

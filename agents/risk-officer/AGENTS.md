# AGENTS — risk-officer

## I Receive From

| Source | What | When |
|--------|------|------|
| strategy-engine | StrategySignal | Every signal |
| market-data | SystemHealthEvent (stale) | On stale data detection |
| apps/api | Kill-switch toggle | Via admin endpoint |

## I Emit To

| Consumer | What |
|----------|------|
| paper-execution | RiskDecision (approved/vetoed) |
| analytics | RiskDecision (for veto rate tracking) |
| apps/api | RiskDecision status, circuit breaker state |

## My Veto Is Final

No other agent can override a veto. paper-execution must reject any order that does not carry an approved RiskDecision with a valid ID matching the current signal.

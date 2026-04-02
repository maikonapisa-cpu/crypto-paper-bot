# AGENTS — paper-execution-engineer

## I Receive From

| Agent | What | When |
|-------|------|------|
| risk-engine | Approved RiskDecision + StrategySignal | Before executing any order |
| market-data | TickerSnapshot | Continuously (for PnL updates) |

## I Emit To

| Consumer | What |
|----------|------|
| apps/api | Portfolio balance, positions, orders, fills |
| analytics | TradeJournalEntry (on close) |
| PostgreSQL | All orders, fills, positions, journal entries |

## I Do NOT Interact With

- strategy-engine (signals come through risk-engine)
- Live exchange endpoints

## Forbidden

- LiveExecutionAdapter implementation
- Accepting orders without a valid riskDecisionId
- Modifying risk rules

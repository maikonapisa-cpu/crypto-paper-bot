# AGENTS — strategy-researcher

## My Outputs Feed

| Consumer | What | When |
|----------|------|------|
| risk-engine | StrategySignal | Every signal before execution |
| paper-execution | Approved StrategySignal (after risk) | After risk-officer approves |
| analytics | StrategySignal (for signal precision tracking) | Every signal |
| doc-writer | Strategy spec | Phase 2 documentation |

## My Dependencies

- shared-types: StrategySignal, Candle, TickerSnapshot, OpenPosition
- market-data: I subscribe to candle and ticker events
- No direct dependency on paper-execution (signals pass through risk first)

## Forbidden

- Direct calls to paper-execution
- Modifying risk-engine rules
- Using private market data
- Claiming signals will be profitable

# AGENTS — market-data-engineer

## Consumers of My Output

| Consumer | What They Need | Format |
|----------|---------------|--------|
| strategy-engine | TickerSnapshot, Candle | Push via EventEmitter |
| paper-execution | TickerSnapshot (for fill pricing) | Push via EventEmitter |
| analytics | TickerSnapshot (for equity snapshots) | Push via EventEmitter |
| apps/api | All feeds (for dashboard WS relay) | Push via EventEmitter |
| risk-engine | SystemHealthEvent (stale data) | Push via EventEmitter |

## Dependencies

- shared-types: for all output schema definitions
- No other packages

## Forbidden Integrations

- private exchange REST endpoints
- authenticated WebSocket streams
- paper-execution, strategy-engine, risk-engine (I emit to them, they don't call me)

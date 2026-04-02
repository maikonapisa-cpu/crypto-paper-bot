# AGENTS — dashboard-builder

## I Consume From apps/api

All data comes via the API layer — I never connect to exchanges directly.

| Endpoint | What |
|----------|------|
| GET /api/portfolio | Balances, equity |
| GET /api/positions | Open positions |
| GET /api/orders | Open orders |
| GET /api/journal | Trade history |
| GET /api/analytics | Performance metrics |
| GET /api/market-data/:symbol/candles | Candle data |
| GET /api/market-data/:symbol/orderbook | Order book |
| WS /ws | All real-time updates |

## State Management

- Zustand stores for: marketData, portfolio, positions, systemHealth, strategyStatus
- All stores hydrate from API on load, then update via WebSocket events

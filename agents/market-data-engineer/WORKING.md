# WORKING — market-data-engineer

## Current Phase: 1 — Scaffold only

No implementation work has started. Waiting for Phase 2 assignment from conductor.

## Files to Create (Phase 2)

- packages/market-data/src/adapters/binance-public.adapter.ts
- packages/market-data/src/adapters/exchange-adapter.interface.ts
- packages/market-data/src/normalizers/ticker.normalizer.ts
- packages/market-data/src/normalizers/candle.normalizer.ts
- packages/market-data/src/normalizers/orderbook.normalizer.ts
- packages/market-data/src/normalizers/trade.normalizer.ts
- packages/market-data/src/feed-distributor.ts
- packages/market-data/src/stale-data-detector.ts
- packages/market-data/src/health.ts
- packages/market-data/src/index.ts
- tests/unit/market-data/normalizer.test.ts
- tests/integration/market-data/live-feed.test.ts

## Assumptions

- Using Binance public streams as primary adapter
- WS URL: wss://stream.binance.com:9443/ws
- REST URL: https://api.binance.com
- No authentication required for public streams
- Stale threshold: configurable via STALE_DATA_THRESHOLD_MS env var

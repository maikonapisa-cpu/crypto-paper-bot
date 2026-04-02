# HEARTBEAT — market-data-engineer

## Current Status

**Phase:** 1 scaffolding  
**Implementation Status:** Not started  
**Blockers:** None

## Phase 2 Task List

- [ ] Create ExchangeAdapter interface in shared-types
- [ ] Implement BinancePublicAdapter (WS + REST)
- [ ] Implement normalizer functions for each data type
- [ ] Implement stale data detector
- [ ] Implement reconnect with exponential backoff
- [ ] Write unit tests for normalizer
- [ ] Write integration test for live feed
- [ ] Document all public endpoint URLs used
- [ ] Hand off to qa-verifier for Phase 2 gate

## Known Risks

- Binance public API rate limits may apply to REST snapshot calls
- WS stream format can change without notice — normalizer must be version-aware
- High-frequency data (order book updates) may require throttling for dashboard perf

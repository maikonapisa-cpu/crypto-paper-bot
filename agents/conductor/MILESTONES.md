# MILESTONES — conductor

> Living document. Updated at the start and end of each phase.
> No phase advances without qa-verifier sign-off.

---

## Phase 1 — Architecture and Scaffolding

**Target:** Everything planned and structured. No guesswork in later phases.

**Status:** 🔄 IN PROGRESS

### Deliverables

| # | Deliverable | Owner | Status |
|---|-------------|-------|--------|
| 1.1 | Architecture plan (docs/02-system-architecture.md) | conductor + doc-writer | ✅ |
| 1.2 | All 9 agent SOUL files | conductor | ✅ |
| 1.3 | All 9 agent README/AGENTS/HEARTBEAT/WORKING files | conductor | ✅ |
| 1.4 | Repository directory structure | conductor | ✅ |
| 1.5 | docs/01-product-scope.md | doc-writer | ✅ |
| 1.6 | docs/02-system-architecture.md | doc-writer | ✅ |
| 1.7 | docs/03 through docs/12 stubs | doc-writer | ✅ |
| 1.8 | docs/08-data-model.md (full) | doc-writer | ✅ |
| 1.9 | docs/10-roadmap.md | doc-writer | ✅ |
| 1.10 | docs/11-live-trading-transition.md | doc-writer | ✅ |
| 1.11 | docs/12-compliance-and-boundaries.md | doc-writer | ✅ |
| 1.12 | .env.example | conductor | ✅ |
| 1.13 | database/schema.sql | paper-execution-engineer | ✅ |
| 1.14 | packages/shared-types/src/index.ts | conductor | ✅ |
| 1.15 | templates/trade-journal-template.md | doc-writer | ✅ |
| 1.16 | templates/strategy-spec-template.md | doc-writer | ✅ |
| 1.17 | package.json + tsconfig.json + vitest.config.ts | conductor | ✅ |
| 1.18 | packages/*/src/index.ts stubs | all owners | 🔄 |
| 1.19 | LiveExecutionAdapter stub (blocked guard) | paper-execution-engineer | ✅ |
| 1.20 | qa-verifier Phase 1 gate | qa-verifier | 📋 |

### Acceptance Criteria (Phase 1)

- [ ] Directory structure matches docs/02-system-architecture.md
- [ ] All 9 agents have all 5 required files
- [ ] All 12 docs exist (stubs acceptable, full docs where marked ✅)
- [ ] shared-types exports all interfaces from docs/08-data-model.md
- [ ] LiveExecutionAdapter throws when instantiated (test must pass)
- [ ] No live trading code paths exist
- [ ] .env.example has MODE=paper and no EXCHANGE_API_KEY
- [ ] qa-verifier signs off

---

## Phase 2 — Market Data Foundation

**Target:** Real market data flows through the system reliably.

**Status:** 📋 PLANNED

**Owner:** market-data-engineer  
**Gate:** qa-verifier

### Key Acceptance Criteria

- Live BTC/USDT ticker and 1m candle data flowing
- Automatic reconnect after simulated disconnect
- Stale data detector fires after STALE_DATA_THRESHOLD_MS
- All output matches shared-types schema (type-checked, no any)
- Unit tests for all normalizers pass
- Integration test: live feed → normalized event → subscriber callback

---

## Phase 3 — Paper Trading Core

**Target:** Full paper trading loop works end-to-end.

**Status:** 📋 PLANNED

**Owners:** strategy-researcher, paper-execution-engineer, risk-officer, analytics-auditor  
**Gate:** qa-verifier

### Key Acceptance Criteria

- DualEMACrossoverStrategy generates BUY/SELL signals with reason codes
- RiskEngine evaluates all 8 checks correctly
- PaperWallet initializes, tracks balances, updates on fills
- FillEngine computes fill price per documented model
- PnLTracker updates unrealized PnL on each ticker
- TakeProfitMonitor fires at +5% (configurable)
- TradeJournal writes complete entry on position close
- **Milestone-1 integration test passes end-to-end**
- LiveExecutionAdapter still throws (guard not removed)

---

## Phase 4 — Dashboard v1

**Target:** A usable, honest, original dashboard displays real system state.

**Status:** 📋 PLANNED

**Owner:** dashboard-builder  
**Gate:** qa-verifier

### Key Acceptance Criteria

- App loads without errors
- PAPER MODE banner permanent and non-dismissible
- All 12 required panels render
- Real-time updates via WebSocket
- Empty state graceful for all panels
- No Binance assets or trademarks

---

## Phase 5 — Analytics, Replay, Test Harness

**Target:** Strategy can be measured and replayed.

**Status:** 📋 PLANNED

**Owners:** analytics-auditor, qa-verifier  
**Gate:** qa-verifier (final)

### Key Acceptance Criteria

- All metrics compute correctly from known dataset
- Replay tooling feeds historical candles through strategy
- All unit, integration, and replay tests pass
- Coverage meets thresholds

---

## DELEGATION LOG

| Task | Assigned To | Phase | Due |
|------|-------------|-------|-----|
| Exchange adapter interface | market-data-engineer | 2 | Phase 2 start |
| BinancePublicAdapter | market-data-engineer | 2 | Phase 2 |
| DualEMACrossoverStrategy (full EMA) | strategy-researcher | 3 | Phase 3 |
| PaperWallet + FillEngine + PnLTracker | paper-execution-engineer | 3 | Phase 3 |
| RiskEngine (all 8 checks, full impl) | risk-officer | 3 | Phase 3 |
| TradeJournal writer | paper-execution-engineer | 3 | Phase 3 |
| Dashboard panels | dashboard-builder | 4 | Phase 4 |
| Analytics metrics module | analytics-auditor | 3/5 | Phase 3+5 |
| All test files | qa-verifier | 2-5 | Per phase |
| All docs expansion | doc-writer | 2-5 | Per phase |

---

## BLOCKERS LOG

*No active blockers as of Phase 1.*

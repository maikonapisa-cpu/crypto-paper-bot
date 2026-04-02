# 10 — Roadmap

## Phase 1 — Architecture and Scaffolding 🔄
**Goal:** Everything planned and structured before any code is written.

- 🔄 Architecture plan and tech stack decision
- 🔄 Agent role definitions (all 9 agents, 5 files each)
- 🔄 Repository directory structure
- 🔄 Doc stubs (all 12 docs/)
- 🔄 Data model specification
- 📋 shared-types interface stubs
- 📋 Database schema (database/schema.sql)
- 📋 qa-verifier Phase 1 gate

**Acceptance:** qa-verifier signs off on structure and doc stubs.

---

## Phase 2 — Market Data Foundation 📋
- 📋 ExchangeAdapter interface (shared-types)
- 📋 BinancePublicAdapter (WebSocket + REST)
- 📋 Normalizers: ticker, candles, order book, trades
- 📋 Stale data detector + reconnect
- 📋 Unit + integration tests
- 📋 qa-verifier gate

---

## Phase 3 — Paper Trading Core 📋
- 📋 DualEMACrossoverStrategy + TakeProfitMonitor
- 📋 PaperWallet + OrderSimulator + FillEngine + PnLTracker
- 📋 RiskEngine (8 checks) + KillSwitch
- 📋 TradeJournal writer
- 📋 Database schema applied
- 📋 Milestone-1 loop integration test (end-to-end)
- 📋 qa-verifier gate

---

## Phase 4 — Dashboard v1 📋
- 📋 Next.js app + all panels
- 📋 PAPER MODE banner (permanent)
- 📋 WebSocket real-time updates
- 📋 Empty state handling
- 📋 qa-verifier gate

---

## Phase 5 — Analytics, Replay, Test Harness 📋
- 📋 Full metrics suite + equity curve
- 📋 Replay tooling on historical data
- 📋 qa-verifier final gate

---

## Out of Scope (v1)
- 🚫 Live trading execution
- 🚫 Futures / perpetuals / margin
- 🚫 Multi-user accounts
- 🚫 ML strategies
- 🚫 Mobile app

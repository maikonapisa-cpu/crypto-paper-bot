# WORKING — conductor

## Active Work Items

### Phase 1: Architecture and Scaffolding

**Item 1:** Produce architecture summary  
**Status:** Complete  
**Output:** docs/02-system-architecture.md

**Item 2:** Define all agent SOUL files  
**Status:** In progress  
**Output:** agents/*/SOUL.md

**Item 3:** Scaffold repository structure  
**Status:** In progress  
**Output:** All directories and stub files

**Item 4:** Enumerate open assumptions  
**Status:** In progress  
**Output:** This document, section below

---

## Open Assumptions (Phase 1)

These assumptions are made now and must be validated or revised before Phase 3:

| # | Assumption | Impact If Wrong |
|---|------------|-----------------|
| 1 | Binance public WS/REST will be primary data source | Swap adapter if needed — abstraction handles this |
| 2 | TypeScript monorepo (pnpm workspaces) is acceptable | Justified in ARCHITECTURE.md |
| 3 | No ORM in v1 — raw SQL with typed wrappers | Adds migration complexity but reduces abstraction weight |
| 4 | Redis is optional in v1 | WebSocket fan-out done in-process for dev |
| 5 | Spot pairs only in v1 | Futures adapter is a future extension point |
| 6 | Single-user system in v1 | Auth layer not implemented |
| 7 | Take-profit at +5% is configurable, default only | Documented clearly as a rule, not a guarantee |
| 8 | Stop-loss disabled by default | Enabled via config, not implemented in signal layer v1 |

---

## Blockers

None currently. Will update as phases proceed.

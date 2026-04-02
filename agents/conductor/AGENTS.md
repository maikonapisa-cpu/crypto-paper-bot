# AGENTS — conductor

## Agent Team Overview

The conductor manages the following agents. Each has a single domain and must not overstep it.

| Agent | Domain | Veto Power |
|-------|--------|------------|
| market-data-engineer | Market data ingestion | No |
| strategy-researcher | Signal logic and strategy | No |
| paper-execution-engineer | Fake wallet and order simulation | No |
| risk-officer | Risk limits and circuit breakers | YES — can veto strategy |
| dashboard-builder | Frontend UI | No |
| analytics-auditor | Performance metrics | No |
| qa-verifier | Quality gate and testing | YES — can block phase completion |
| doc-writer | Documentation | No |

## Interaction Rules

1. Agents communicate through documented interfaces (shared-types), not direct calls
2. risk-officer can veto any strategy decision at runtime
3. qa-verifier must approve each phase before the conductor advances
4. No agent may implement live trading features
5. If two agents disagree on an interface, the conductor decides — defaulting to the shared-types definition

## Escalation

If an agent is blocked:
1. Agent logs the blocker in their WORKING.md
2. Conductor reviews and either: resolves it, re-routes it, or documents it as a known risk
3. Phase does not advance until blockers are resolved or explicitly accepted as deferred

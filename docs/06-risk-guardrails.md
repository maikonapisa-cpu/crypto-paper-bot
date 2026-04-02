# 06 — Risk Guardrails

> **Status:** Stub — Full specification written in Phase 3 after implementation.

---

## Overview

The risk engine evaluates every strategy signal before it reaches the execution layer. Its veto is final. No order may be placed without a valid, approved `RiskDecision` referencing the signal that triggered it.

---

## Pre-Trade Checks (Ordered)

| # | Check | Veto Reason |
|---|-------|-------------|
| 1 | Kill switch active? | `KILL_SWITCH_ACTIVE` |
| 2 | Market data stale? | `STALE_MARKET_DATA` |
| 3 | Max concurrent positions reached? | `MAX_POSITIONS_REACHED` |
| 4 | Insufficient balance? | `INSUFFICIENT_BALANCE` |
| 5 | Position size exceeds limit? | Reduce to allowed or `MAX_POSITION_SIZE_EXCEEDED` |
| 6 | Daily loss limit breached? | `DAILY_LOSS_LIMIT_REACHED` |
| 7 | Cooldown active for this pair? | `COOLDOWN_ACTIVE` |
| 8 | Abnormal volatility? (optional) | `ABNORMAL_VOLATILITY` |

---

## Kill Switch

The kill switch can be activated via:
- API endpoint: `POST /api/risk/kill-switch` `{ active: true }`
- Automatic: when daily loss limit is breached
- Automatic: when stale data persists beyond a configurable threshold

When the kill switch is active:
- All new signals are vetoed
- Existing open positions are NOT auto-closed (manual decision required)
- Status is visible on the dashboard risk panel

---

## Configuration

All limits are set in `.env`:

```
RISK_MAX_CONCURRENT_POSITIONS=3
RISK_MAX_POSITION_SIZE_PCT=20
RISK_MAX_DAILY_LOSS_PCT=10
RISK_COOLDOWN_PERIOD_SEC=60
```

---

## Phase 3 Implementation Checklist

- [ ] RiskEngine class with all 8 checks
- [ ] KillSwitch module
- [ ] CooldownTimer per pair
- [ ] Integration with stale data health events
- [ ] Unit tests for each individual check
- [ ] Integration test: veto blocks execution
- [ ] Integration test: approved signal proceeds
- [ ] Kill switch API endpoint

*This document will be expanded after Phase 3 implementation.*

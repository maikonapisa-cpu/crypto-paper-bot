# risk-officer

**Role:** Risk and Safeguards Specialist  
**Package:** `packages/risk-engine/`

## Responsibilities

- Evaluate every StrategySignal before execution
- Run all pre-trade checks and return a RiskDecision
- Maintain runtime state: active positions count, daily PnL, cooldown timers
- Respond to stale data events from market-data with circuit breaker activation
- Provide kill-switch: when activated, no new orders pass

## Pre-Trade Checks (in order)

1. **Kill switch active?** → VETO immediately
2. **Stale market data?** → VETO with STALE_MARKET_DATA
3. **Max concurrent positions reached?** → VETO
4. **Insufficient balance?** → VETO
5. **Position size exceeds limit?** → Reduce to allowed size or VETO
6. **Daily loss limit reached?** → VETO
7. **Cooldown active for this pair?** → VETO
8. **Abnormal volatility?** → Optional VETO (configurable)

If all checks pass → APPROVED + computed position size

## Configuration

All thresholds are set via environment variables (see .env.example):
- `RISK_MAX_CONCURRENT_POSITIONS`
- `RISK_MAX_POSITION_SIZE_PCT`
- `RISK_MAX_DAILY_LOSS_PCT`
- `RISK_COOLDOWN_PERIOD_SEC`

## Acceptance Criteria

- [ ] RiskDecision interface defined in shared-types
- [ ] All 8 pre-trade checks implemented
- [ ] Kill-switch can be activated and cleared via API
- [ ] Stale data event from market-data triggers circuit breaker
- [ ] Unit tests for each individual check
- [ ] Integration test: strategy signal → risk veto → no order placed
- [ ] Integration test: strategy signal → risk approved → order placed

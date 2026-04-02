# 11 — Live Trading Transition

> **⚠️ THIS DOCUMENT DESCRIBES A FUTURE CAPABILITY THAT IS NOT IMPLEMENTED IN V1.**
>
> Live trading is explicitly out of scope for this version. This document exists to define the requirements and safeguards that would be needed to add it in the future, and to ensure those requirements are designed into the architecture from the start.

---

## Current Status

Live trading: **NOT IMPLEMENTED. BLOCKED.**

In v1, the `LiveExecutionAdapter` class exists only as a stub that throws an error on instantiation. `MODE=live` is not a valid configuration value and will cause the system to refuse to start.

---

## Why Live Mode Is Gated

Paper trading and live trading are fundamentally different activities with different risk profiles. Crossing that boundary accidentally — through a config mistake, a copy-paste error, or a missing guard — could result in real financial loss.

The architecture enforces this boundary structurally:
- All execution flows through an `ExecutionAdapter` interface
- Only `PaperExecutionAdapter` is implemented and enabled in v1
- `LiveExecutionAdapter` throws at construction unless multiple conditions are met
- `MODE=live` is not accepted by the config validation layer in v1

---

## Requirements for a Future Live Trading Extension

If live trading is ever added, ALL of the following must be true:

### Configuration Requirements
- `MODE=live` explicitly set
- `EXCHANGE_API_KEY` and `EXCHANGE_API_SECRET` present and validated
- `LIVE_TRADING_ENABLED=true` explicitly set (separate from MODE)
- `LIVE_TRADING_CONFIRMED=I_UNDERSTAND_THIS_USES_REAL_FUNDS` set (user must type this string)

### Code Requirements
- `LiveExecutionAdapter` fully implemented and reviewed
- All tests passing including live-mode integration tests against testnet
- A separate code path review confirming no paper mode code runs in live mode
- Risk limits reviewed and confirmed appropriate for live capital

### Operational Requirements
- Exchange testnet validated before mainnet
- Start with minimal position sizes
- Circuit breakers must be tested live
- Kill-switch must be tested live
- Monitoring and alerting in place

### Documentation Requirements
- Full live trading architecture doc written
- Risk disclosure updated
- Deployment runbook written

---

## Architectural Decision: Adapter Pattern

The adapter interface was designed specifically to make this future transition clean:

```typescript
// v1 — paper only
const adapter = new PaperExecutionAdapter(config);

// Future v2 — live (requires all guards to pass)
const adapter = new LiveExecutionAdapter(config); // throws if not fully configured
```

The rest of the system is identical. Strategy → Risk → ExecutionAdapter is the same flow. Only the adapter changes.

---

## DO NOT

- Add `MODE=live` to any `.env` file or checked-in config
- Implement `LiveExecutionAdapter` as a copy of `PaperExecutionAdapter`
- Remove the guard in `LiveExecutionAdapter`'s constructor
- Add live trading to the dashboard without explicit, separate phase approval

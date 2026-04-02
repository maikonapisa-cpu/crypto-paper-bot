# 03 — Paper Trading Engine

> **Status:** Stub — Full documentation written in Phase 3 after implementation.

---

## Overview

The paper trading engine simulates the full lifecycle of a trade without using real funds or placing real orders. It consists of five interconnected components:

1. **PaperWallet** — Tracks fake balances and asset holdings
2. **OrderSimulator** — Accepts strategy signals and creates simulated orders
3. **FillEngine** — Computes fill price using mid-price + slippage model
4. **PnLTracker** — Computes unrealized and realized PnL per position
5. **TradeJournal** — Records every completed trade with full audit fields

---

## Fill Price Model (Summary)

```
midPrice            = (bestBid + bestAsk) / 2
slippageAdjustment  = midPrice × (PAPER_SLIPPAGE_BPS / 10000)
fillPrice (buy)     = midPrice + slippageAdjustment
fillPrice (sell)    = midPrice - slippageAdjustment
fee                 = fillPrice × quantity × PAPER_FEE_RATE_TAKER
```

All parameters are configurable. All assumptions are logged per fill.

---

## Take-Profit Logic (Summary)

The take-profit monitor runs on every ticker update for all open positions:

```
unrealizedPnlPct = ((currentPrice - entryPrice) / entryPrice) × 100
if unrealizedPnlPct >= STRATEGY_TAKE_PROFIT_PCT:
    → generate TAKE_PROFIT_HIT signal
    → risk-engine evaluates (fast-path approval for take-profit)
    → close position at current mid-price
```

---

## Paper vs Live Separation

```
ExecutionAdapter (interface in shared-types)
├── PaperExecutionAdapter  ✅ Implemented
└── LiveExecutionAdapter   🚫 Stub only — blocked in v1
```

See [11 — Live Trading Transition](11-live-trading-transition.md) for the requirements to enable live mode in a future version.

---

## Phase 3 Implementation Checklist

- [ ] PaperWallet implementation
- [ ] OrderSimulator implementation
- [ ] FillEngine with slippage model
- [ ] PnLTracker (unrealized per tick, realized on close)
- [ ] TakeProfitMonitor
- [ ] TradeJournal writer (all fields from data model)
- [ ] LiveExecutionAdapter stub with blocking guard
- [ ] Unit tests for all components
- [ ] Integration test: full loop end-to-end

*This document will be expanded to full specification after Phase 3 implementation is complete.*

# paper-execution-engineer

**Role:** Simulated Order and Wallet Specialist  
**Package:** `packages/paper-execution/`

## Responsibilities

- PaperWallet: track USDT balance, asset holdings, locked amounts
- OrderSimulator: accept orders from the execution layer, return fills
- FillEngine: compute fill price using mid-price + slippage model
- PnLTracker: compute unrealized PnL per tick, realized PnL on close
- TradeJournal: write complete journal entries for every closed trade
- Take-profit exit: when position PnL >= configured threshold, generate close signal

## Fill Price Model

```
midPrice = (bid + ask) / 2
slippageAdjustment = midPrice * (slippageBps / 10000)
fillPrice (buy)  = midPrice + slippageAdjustment
fillPrice (sell) = midPrice - slippageAdjustment
fee = fillPrice * quantity * feeRate
```

All parameters are configurable. All assumptions are logged in every fill record.

## Paper vs Live Separation

```
ExecutionAdapter (interface)
├── PaperExecutionAdapter ✅ Implemented
└── LiveExecutionAdapter  🚫 NOT IMPLEMENTED — blocked by guard
```

The live adapter exists as a stub class that throws immediately if instantiated outside of `MODE=live`. Since `MODE=live` is not supported in v1, it is permanently blocked.

## Acceptance Criteria

- [ ] PaperWallet initializes with configured USDT balance
- [ ] Buy order deducts USDT, credits base asset
- [ ] Sell order deducts base asset, credits USDT (minus fee)
- [ ] Fill price computed correctly with slippage model
- [ ] Unrealized PnL updates on each ticker event
- [ ] Take-profit fires at +5% unrealized PnL (configurable)
- [ ] TradeJournal entry complete on every position close
- [ ] Unit tests for fill price calculation
- [ ] Unit tests for PnL calculation
- [ ] Integration test for full open → fill → take-profit → close loop

# Trade Journal Entry Template

> Use this template when manually reviewing or auditing a trade journal entry.
> The system populates these fields automatically; this template is for human review.

---

## Trade Reference

| Field | Value |
|-------|-------|
| Journal Entry ID | `{id}` |
| Position ID | `{positionId}` |
| Entry Order ID | `{entryOrderId}` |
| Exit Order ID | `{exitOrderId}` |

---

## Trade Summary

| Field | Value |
|-------|-------|
| Symbol | `{symbol}` |
| Side | `{side}` (long / short) |
| Outcome | `{outcome}` (win / loss / breakeven / open) |

---

## Signal Traceability

### Entry Signal
| Field | Value |
|-------|-------|
| Signal ID | `{entrySignalId}` |
| Reason Code | `{entrySignalReasonCode}` |
| Reason Detail | `{entrySignalReasonDetail}` |

### Exit Signal
| Field | Value |
|-------|-------|
| Signal ID | `{exitSignalId}` |
| Reason Code | `{exitSignalReasonCode}` |
| Reason Detail | `{exitSignalReasonDetail}` |

---

## Prices

| Field | Value |
|-------|-------|
| Entry Price | `{entryPrice}` |
| Exit Price | `{exitPrice}` |
| Take-Profit Trigger | `+{takeProfitTriggerPct}%` |
| Stop-Loss Trigger | `{stopLossTriggerPct}%` (0 = disabled) |

---

## Quantities and Costs

| Field | Value |
|-------|-------|
| Quantity | `{quantity}` {baseAsset} |
| Entry Fee (USDT) | `{entryFeeUsdt}` |
| Exit Fee (USDT) | `{exitFeeUsdt}` |
| Total Fees (USDT) | `{totalFeesUsdt}` |
| Assumed Slippage (BPS) | `{assumedSlippageBps}` |
| Estimated Slippage Cost | `{estimatedSlippageCost}` USDT |

---

## PnL

| Field | Value |
|-------|-------|
| Gross PnL (USDT) | `{grossPnlUsdt}` |
| Net PnL (USDT) | `{netPnlUsdt}` (after fees) |
| Net PnL (%) | `{netPnlPct}%` |

---

## Timing

| Field | Value |
|-------|-------|
| Opened At | `{openedAt}` |
| Closed At | `{closedAt}` |
| Duration | `{durationMs}` ms |

---

## Notes and Tags

**Notes:** `{notes}`

**Tags:** `{tags}`

---

## Disclaimer

> This is a simulated paper trade. The fill price, fees, and slippage are modeled estimates.
> Actual exchange execution may differ materially.
> This record does not represent real financial activity.

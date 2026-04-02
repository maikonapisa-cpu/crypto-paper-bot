# 07 — Dashboard UI

> **Status:** Stub — Full specification written in Phase 4 after implementation.

---

## Overview

The dashboard is an original, exchange-inspired interface for monitoring the paper trading bot. It is built in Next.js with TypeScript and Tailwind CSS. It does not impersonate any exchange.

---

## Required Panels

| Panel | Location | Updates |
|-------|----------|---------|
| PAPER MODE Banner | Top of every page, permanent | Static |
| Pair Selector | Top left | On user action |
| Price Chart | Center | Real-time via WS |
| Order Book | Right column | Real-time via WS |
| Recent Trades | Below order book | Real-time via WS |
| Signal Panel | Below chart | On new signal |
| Open Positions | Bottom left | Real-time PnL |
| Open Orders | Below positions | On fill/cancel |
| Portfolio Balances | Right panel | On every fill |
| Trade History | Tab below chart area | On close |
| Performance Summary | Analytics tab | On snapshot |
| System Health | Status bar | On WS event |
| Risk Status | Status bar | On risk event |

---

## PAPER MODE Banner (Non-Negotiable)

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  PAPER TRADING ONLY — NOT CONNECTED TO LIVE FUNDS ⚠️         │
└─────────────────────────────────────────────────────────────────┘
```

- Fixed at top of layout
- Not dismissible
- High contrast warning colors
- Present on all pages and views

---

## Design Principles

- Dark theme primary
- Exchange-like information density without clutter
- Original color palette (not Binance yellow/black)
- Monospace fonts for prices and quantities
- Clear status indicators (green/red for PnL, amber for warnings)
- No exchange logos, trademarks, or brand assets

---

## Phase 4 Implementation Checklist

- [ ] Next.js scaffold with Tailwind
- [ ] Layout with permanent PAPER MODE banner
- [ ] All panels listed above
- [ ] Zustand stores (5 stores)
- [ ] WebSocket hook and reconnect
- [ ] Empty state for all panels
- [ ] No console errors on load
- [ ] Responsive layout (desktop primary)

*This document will be expanded after Phase 4 implementation.*

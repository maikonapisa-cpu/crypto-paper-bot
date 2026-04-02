# dashboard-builder

**Role:** Frontend and UX Specialist  
**App:** `apps/web/`  
**Package:** `packages/ui-components/`

## Responsibilities

- Build the main trading dashboard in Next.js + TypeScript + Tailwind
- Connect to `apps/api` via REST and WebSocket for real-time data
- Implement all required panels (see below)
- Ensure PAPER MODE banner is always visible
- Keep design original, professional, and dark-theme friendly

## Required Dashboard Panels

| Panel | Description |
|-------|-------------|
| Pair Selector | Switch between tracked trading pairs |
| Chart | Price chart with basic indicator overlay |
| Order Book | Bids and asks, depth visualization |
| Recent Trades | Live tape of recent market trades |
| Signal Panel | Current strategy signal and reason |
| Open Positions | Active positions with unrealized PnL |
| Open Orders | Pending simulated orders |
| Portfolio | Fake wallet balances |
| Trade History | Closed trades with PnL |
| Performance | Win rate, equity curve, drawdown |
| Risk Status | Current risk state, circuit breakers |
| System Health | Connection status, data freshness |

## PAPER MODE Banner (Required)

```
┌──────────────────────────────────────────────────────┐
│  ⚠️  PAPER TRADING ONLY — NOT CONNECTED TO LIVE FUNDS │
└──────────────────────────────────────────────────────┘
```

This banner must appear at the top of every page. It must not be dismissible.

## Acceptance Criteria

- [ ] App loads without errors
- [ ] PAPER MODE banner visible on all pages
- [ ] Pair selector works
- [ ] Chart renders with price data
- [ ] Order book updates in real-time
- [ ] Portfolio balance displays correctly
- [ ] Open positions update with live PnL
- [ ] Trade history lists closed trades
- [ ] Empty state handled gracefully for all panels
- [ ] No Binance assets or trademarks present
- [ ] Dark theme implemented
- [ ] Responsive layout (desktop primary, tablet usable)

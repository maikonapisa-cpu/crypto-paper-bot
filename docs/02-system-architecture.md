# 02 — System Architecture

## Overview

CryptoPaperBot is a **TypeScript monorepo** consisting of a Next.js frontend, a Node.js API backend, and a set of domain packages that encapsulate each major concern independently.

---

## Tech Stack Decision

### Backend: Node.js + TypeScript

**Chosen over Python FastAPI because:**
- Enables a true monorepo with shared TypeScript types between frontend and backend — eliminating a class of schema drift bugs
- WebSocket handling, event-driven architecture, and stream processing are idiomatic in Node.js
- A single language across the stack reduces cognitive load for contributors
- `pnpm` workspaces provide clean package boundaries within one repository

**Tradeoffs acknowledged:**
- Python has a richer ecosystem for quant research (pandas, numpy, backtrader)
- If a strategy backtesting module is added later, a Python sidecar can be added as a separate service while keeping the core stack consistent

### Frontend: Next.js + TypeScript + Tailwind CSS

- Next.js provides SSR capability for initial load performance and a well-understood routing model
- Tailwind enables rapid layout work with design consistency
- Zustand for local UI state (lightweight, TypeScript-friendly, no boilerplate)
- Recharts or lightweight custom SVG for charting (no TradingView dependency in core — wrapper layer allows future upgrade)

### Database: PostgreSQL

- Durable storage for trade journals, positions, orders, and analytics snapshots
- Structured queries for PnL analysis and replay
- Migrations managed via a simple SQL migration system (no ORM required in v1; raw queries with typed wrappers)

### Redis: Optional

- Enabled via `REDIS_ENABLED=true`
- Used for: ticker stream caching, task queues, WebSocket broadcast fan-out
- System must run without Redis in development (in-memory fallback)

---

## Monorepo Layout

```
crypto-paper-bot/
├── apps/
│   ├── web/                    # Next.js dashboard
│   └── api/                    # Express/Fastify API server
├── packages/
│   ├── shared-types/           # All domain interfaces — source of truth
│   ├── market-data/            # Exchange adapters, WebSocket, REST, normalization
│   ├── strategy-engine/        # Signal interfaces, strategy classes, pipeline
│   ├── paper-execution/        # Paper wallet, order simulator, fill engine, PnL
│   ├── risk-engine/            # Pre-trade checks, circuit breakers, veto layer
│   ├── analytics/              # Metrics computation, equity curve, reporting
│   └── ui-components/          # Shared React components
├── agents/                     # OpenClaw agent definitions
├── docs/                       # Specifications
├── database/                   # Schema and migrations
├── templates/                  # Strategy and journal templates
└── tests/                      # Unit, integration, replay
```

---

## System Layers and Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Exchange (PUBLIC)                        │
│              WebSocket streams + REST snapshots             │
└────────────────────────────┬────────────────────────────────┘
                             │ raw market events
┌────────────────────────────▼────────────────────────────────┐
│                  market-data package                         │
│  • ExchangeAdapter (public only)                             │
│  • Normalizer → internal MarketEvent schema                  │
│  • Stale data detector + heartbeat                           │
│  • Feed distributor (emit to subscribers)                    │
└────────────────────────────┬────────────────────────────────┘
                             │ normalized MarketEvent
        ┌────────────────────┼────────────────────────┐
        │                    │                         │
┌───────▼──────┐   ┌─────────▼────────┐   ┌──────────▼──────┐
│  strategy-   │   │   risk-engine    │   │   analytics     │
│  engine      │   │                  │   │                 │
│  • signal    │   │  • pre-trade     │   │  • equity       │
│    pipeline  │──▶│    checks        │   │    snapshots    │
│  • reason    │   │  • veto layer    │   │  • metrics      │
│    codes     │   │  • circuit       │   │    aggregation  │
└──────────────┘   │    breakers      │   └─────────────────┘
        │          └─────────┬────────┘
        │ signal             │ approved / vetoed
        └──────────▶─────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                paper-execution package                       │
│  • PaperWallet (fake balances, positions)                    │
│  • OrderSimulator (fill at mid-price + slippage)             │
│  • FillEngine (partial fills, fee deduction)                 │
│  • PnLTracker (unrealized, realized)                         │
│  • TakeProfitMonitor (auto-close at +5%)                     │
│  • TradeJournal (write every event)                          │
└────────────────────────────┬────────────────────────────────┘
                             │ state updates
┌────────────────────────────▼────────────────────────────────┐
│                   PostgreSQL                                  │
│  • orders, positions, fills, journal_entries                  │
│  • analytics_snapshots, system_health_events                 │
└────────────────────────────┬────────────────────────────────┘
                             │ REST + WebSocket
┌────────────────────────────▼────────────────────────────────┐
│                  apps/api (Express server)                    │
│  • /api/market-data — ticker, candles, orderbook            │
│  • /api/portfolio — balances, positions, orders              │
│  • /api/journal — trade history                              │
│  • /api/analytics — metrics, equity curve                    │
│  • /ws — real-time updates to dashboard                      │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP + WS
┌────────────────────────────▼────────────────────────────────┐
│                  apps/web (Next.js)                           │
│  • Dashboard with pair selector, charts, order book          │
│  • Portfolio view, positions, orders                         │
│  • Trade history, analytics widgets                          │
│  • System health + strategy status                           │
│  • PAPER MODE banner (always visible)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Adapter Interface Pattern

The execution layer is always accessed via an **ExecutionAdapter** interface. In v1, only `PaperExecutionAdapter` is implemented. A future `LiveExecutionAdapter` would implement the same interface but is blocked by guards.

```typescript
// In shared-types
interface ExecutionAdapter {
  placeOrder(params: PlaceOrderParams): Promise<OrderResult>;
  cancelOrder(orderId: string): Promise<void>;
  getBalance(): Promise<PortfolioBalance>;
  getOpenPositions(): Promise<OpenPosition[]>;
}

// Paper adapter — always available
class PaperExecutionAdapter implements ExecutionAdapter { ... }

// Live adapter — BLOCKED in v1, gated in future
class LiveExecutionAdapter implements ExecutionAdapter {
  constructor() {
    if (process.env.MODE !== 'live') {
      throw new Error('Live mode is disabled. See docs/11-live-trading-transition.md');
    }
    // additional safety checks required
  }
}
```

---

## Key Design Principles

1. **Packages never import from apps** — packages are infrastructure; apps consume packages
2. **shared-types is the schema contract** — no inline type definitions in apps or packages
3. **Market data flows one direction** — from exchange → normalizer → subscribers
4. **Risk layer can always veto** — strategy signals must pass risk checks before reaching execution
5. **Everything is logged** — no silent failures, no invisible decisions
6. **Paper mode is structural** — it is not a flag on a function; it is a different adapter class

---

## Runtime Environment

| Component | Default Port | Description |
|-----------|-------------|-------------|
| `apps/web` | 3000 | Next.js dashboard |
| `apps/api` | 3001 | REST + WebSocket API |
| PostgreSQL | 5432 | Persistent storage |
| Redis | 6379 | Optional stream cache |

---

## Dependency Graph

```
apps/web      → packages/ui-components, shared-types
apps/api      → packages/market-data, strategy-engine, paper-execution, risk-engine, analytics, shared-types
packages/*    → packages/shared-types only (no cross-package deps)
```

This strict dependency direction prevents circular imports and keeps packages independently testable.

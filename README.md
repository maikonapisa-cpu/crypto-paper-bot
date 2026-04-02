# 🤖 CryptoPaperBot

> **⚠️ PAPER TRADING ONLY — NOT CONNECTED TO LIVE FUNDS ⚠️**
>
> This system simulates cryptocurrency trading using real market data and a fake wallet.
> It does not place real orders. It does not hold real funds. It is a research and simulation tool only.

---

## What Is This?

CryptoPaperBot is a **simulator-first crypto paper trading platform** designed for research, strategy validation, and learning. It connects to public exchange APIs to fetch real market data, then simulates order placement, position tracking, and PnL calculation against a configurable fake balance.

**No private exchange keys. No real execution. No live funds. Ever — by default.**

---

## Key Features

- Live market data via public WebSocket and REST endpoints
- Configurable fake wallet (default: 10,000 USDT starting balance)
- Simulated order fills with configurable fee and slippage assumptions
- Automated take-profit at +5% unrealized PnL (configurable)
- Full trade journal with reason codes, timestamps, and PnL breakdown
- Risk layer with circuit breakers, position limits, and kill-switch
- Exchange-inspired dashboard (original design — not a Binance clone)
- Modular strategy engine with pluggable signal logic
- Analytics module tracking win rate, drawdown, equity curve, and more

---

## Monorepo Structure

```
crypto-paper-bot/
├── apps/
│   ├── web/          # Next.js frontend dashboard
│   └── api/          # Node.js + TypeScript backend
├── packages/
│   ├── shared-types/ # All shared TypeScript interfaces
│   ├── market-data/  # Market data ingestion layer
│   ├── strategy-engine/   # Signal generation and strategy logic
│   ├── paper-execution/   # Fake wallet, order simulator, fill engine
│   ├── risk-engine/       # Risk checks, limits, circuit breakers
│   ├── analytics/         # Performance metrics and reporting
│   └── ui-components/     # Shared React components
├── agents/           # OpenClaw agent definitions (SOUL, HEARTBEAT, etc.)
├── docs/             # Architecture and specification documents
├── database/         # Schema and migrations
├── templates/        # Strategy spec and journal entry templates
└── tests/            # Unit, integration, and replay tests
```

---

## Quick Start (Paper Mode Only)

```bash
# 1. Clone and install
git clone <repo-url>
cd crypto-paper-bot
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env — MODE must remain "paper"

# 3. Run database migrations
pnpm db:migrate

# 4. Start development servers
pnpm dev
```

The dashboard will be available at `http://localhost:3000`.

---

## Safety Rules

| Rule | Status |
|------|--------|
| Default mode | `MODE=paper` always |
| Live mode | Not implemented in this version |
| Private API keys | Not used, not required |
| Real order placement | Blocked at architecture level |
| Live trading opt-in | Requires future explicit gated extension |

---

## Important Disclaimers

- Paper trading results **do not guarantee** live trading performance
- Simulated fills assume simplified market microstructure
- Slippage, fees, spread, and latency are modeled as configurable estimates only
- Past strategy signals in simulation are **not** predictive of future returns
- This tool is for research and learning purposes only

---

## Agent Team

This system is designed and maintained by a multi-agent OpenClaw workspace. See `agents/` for role definitions.

| Agent | Role |
|-------|------|
| `conductor` | Master coordinator and milestone planner |
| `market-data-engineer` | Market data ingestion and normalization |
| `strategy-researcher` | Signal logic and strategy design |
| `paper-execution-engineer` | Fake wallet and simulated order fills |
| `risk-officer` | Risk limits, vetoes, and circuit breakers |
| `dashboard-builder` | Frontend dashboard and UX |
| `analytics-auditor` | Performance metrics and evaluation |
| `qa-verifier` | Testing, verification, and quality gates |
| `doc-writer` | Documentation and developer guides |

---

## Documentation

See the `docs/` directory for full specifications:

- [01 — Product Scope](docs/01-product-scope.md)
- [02 — System Architecture](docs/02-system-architecture.md)
- [03 — Paper Trading Engine](docs/03-paper-trading-engine.md)
- [04 — Market Data and Execution](docs/04-market-data-and-execution.md)
- [05 — Strategy Framework](docs/05-strategy-framework.md)
- [06 — Risk Guardrails](docs/06-risk-guardrails.md)
- [07 — Dashboard UI](docs/07-dashboard-ui.md)
- [08 — Data Model](docs/08-data-model.md)
- [09 — Testing and Metrics](docs/09-testing-and-metrics.md)
- [10 — Roadmap](docs/10-roadmap.md)
- [11 — Live Trading Transition](docs/11-live-trading-transition.md)
- [12 — Compliance and Boundaries](docs/12-compliance-and-boundaries.md)

---

## License

Research and simulation use only. See `docs/12-compliance-and-boundaries.md` for full scope limitations.

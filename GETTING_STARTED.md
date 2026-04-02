# Getting Started

> **⚠️ PAPER TRADING ONLY — NOT CONNECTED TO LIVE FUNDS**

This guide gets the bot running from scratch in under 10 minutes.

---

## Prerequisites

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Node.js | 20.x | https://nodejs.org |
| pnpm | 9.x | `npm install -g pnpm` |
| PostgreSQL | 14+ | https://www.postgresql.org/download/ |

You do **not** need any exchange account or API keys.

---

## Step 1 — Clone and Install

```bash
# Unzip the archive (or clone from git)
unzip crypto-paper-bot-phase2.zip
cd crypto-paper-bot

# Install all dependencies (all packages at once)
pnpm install
```

---

## Step 2 — Configure Environment

```bash
cp .env.example .env
```

Open `.env` — the defaults work for most setups. The only thing you
might need to change is `DATABASE_URL`:

```env
# Make sure this matches your local Postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cryptopaperbot

# Everything else has sensible defaults:
MODE=paper                         # DO NOT change this
PAPER_WALLET_INITIAL_USDT=10000   # Your starting fake balance
STRATEGY_TAKE_PROFIT_PCT=5.0      # Auto-close at +5% unrealized PnL
STRATEGY_DEFAULT_PAIR=BTC/USDT    # Which pair to trade
```

---

## Step 3 — Create the Database

```bash
# Create the database in Postgres first:
psql -U postgres -c "CREATE DATABASE cryptopaperbot;"

# Run migrations (creates all 14 tables):
node database/migrate.js
```

---

## Step 4 — Start the Bot

```bash
pnpm dev
```

You'll see:

```
╔══════════════════════════════════════════════════════════╗
║  ⚠️  PAPER TRADING ONLY — NOT CONNECTED TO LIVE FUNDS ⚠️  ║
╚══════════════════════════════════════════════════════════╝

[Server] Mode: PAPER | Pair: BTC/USDT | Wallet: 10000 USDT
[Server] API running on http://localhost:3001
[Server] WebSocket on  ws://localhost:3001/ws
[Engine] Seeding strategy with historical candles...
[Engine] Seeded with 100 candles
[Engine] Connected to market data feed
[Engine] ✅ Engine running. Watching for signals...
```

---

## Step 5 — Verify It's Working

Open these in your browser while the bot runs:

| URL | What You'll See |
|-----|----------------|
| http://localhost:3001/health | `{"status":"ok","mode":"paper"}` |
| http://localhost:3001/api/status | Full system status + health |
| http://localhost:3001/api/portfolio | Current fake wallet balance |
| http://localhost:3001/api/positions | Open positions |
| http://localhost:3001/api/journal | Trade history (empty until first trade) |
| http://localhost:3001/api/analytics | Performance metrics |

---

## How the Bot Works

```
Live BTC/USDT candles (Binance public WebSocket)
    ↓
DualEMACrossoverStrategy  (EMA 9 vs EMA 21 on 1m candles)
    ↓
RiskEngine  (8 checks: kill switch, stale data, max positions, balance, daily loss, cooldown...)
    ↓  if approved
PaperExecutionAdapter  (fake wallet, simulated fill at mid-price + 5 BPS slippage)
    ↓  position open
TakeProfitMonitor  (watches every ticker tick — closes at +5% unrealized PnL)
    ↓  position closed
TradeJournal  (full record: signal, entry, exit, PnL, fees, duration)
```

A BUY signal fires when the 9-period EMA crosses above the 21-period EMA on a closed 1-minute candle. The position auto-closes when unrealized PnL hits +5%.

**This is a simulation. EMA crossover is a lagging indicator. Results in simulation do not predict live trading performance.**

---

## Watching Signals in Real Time

WebSocket endpoint: `ws://localhost:3001/ws`

Connect with any WS client (e.g. `wscat`):

```bash
npx wscat -c ws://localhost:3001/ws
```

You'll receive a stream of events like:
```json
{"type":"ticker","payload":{"symbol":"BTC/USDT","midPrice":67432.5,...}}
{"type":"signal","payload":{"action":"buy","reasonCode":"EMA_CROSSOVER_BULLISH",...}}
{"type":"position_opened","payload":{"symbol":"BTC/USDT","entryPrice":67445,...}}
{"type":"portfolio_update","payload":{"totalEquityUsdt":10032,...}}
```

---

## Risk Controls

**Kill switch via API:**

```bash
# Activate (blocks all new orders)
curl -X POST http://localhost:3001/api/risk/kill-switch \
  -H "Content-Type: application/json" \
  -d '{"active": true, "reason": "Manual pause"}'

# Deactivate
curl -X POST http://localhost:3001/api/risk/kill-switch \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

**Kill switch auto-activates if:**
- Daily loss exceeds `RISK_MAX_DAILY_LOSS_PCT` (default 10%)
- *(Stale data blocks buys but does not activate kill switch)*

---

## Run Tests

```bash
# All tests
pnpm test

# Just unit tests (no network needed)
pnpm test:unit

# Watch mode
pnpm test:watch
```

---

## Changing the Strategy

Edit `.env`:

```env
EMA_FAST_PERIOD=9     # default
EMA_SLOW_PERIOD=21    # default
STRATEGY_TAKE_PROFIT_PCT=3.0  # tighter exits
RISK_MAX_CONCURRENT_POSITIONS=1  # one trade at a time
```

Restart the bot after any config change.

---

## Project Structure (Phase 2 — what's implemented)

```
packages/
  shared-types/     ← All TypeScript interfaces
  market-data/      ← BinancePublicAdapter (WS + REST), normalizers
  strategy-engine/  ← DualEMACrossoverStrategy, TakeProfitMonitor, EMA calc
  paper-execution/  ← PaperWallet, FillEngine, PnLTracker, TradeJournal
  risk-engine/      ← RiskEngine (8 checks), kill switch
  analytics/        ← computeMetrics()

apps/
  api/              ← Express server + WebSocket broadcaster
                    ← All REST endpoints
                    ← TradingEngine (orchestrates the full loop)
```

**Not yet built (Phase 4):**
- `apps/web/` — the Next.js dashboard UI

The API is running and fully functional without the dashboard. You can connect any frontend or WebSocket client to it.

---

## Disclaimer

> Paper trading results do not guarantee live trading performance. Simulated fills use a simplified mid-price + slippage model. Fees are estimated at the configured rate. Real exchange execution may differ materially. This system is for research and learning only. Nothing here constitutes financial advice.

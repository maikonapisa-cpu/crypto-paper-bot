# 04 — Market Data and Execution

> **Status:** Stub — Full documentation written in Phase 2 after implementation.

---

## Overview

The market data layer connects to public exchange APIs and provides normalized, typed market events to all downstream consumers. It supports WebSocket streaming as the primary transport and REST snapshot polling as a fallback.

---

## Public Endpoints Used

| Exchange | WS URL | REST URL | Auth Required |
|----------|--------|----------|---------------|
| Binance (public) | wss://stream.binance.com:9443/ws | https://api.binance.com | No |

All endpoints are public and unauthenticated. Private endpoints are not used and must not be added.

---

## Data Types Ingested

| Type | WS Stream | REST Fallback |
|------|-----------|---------------|
| Ticker | `<symbol>@ticker` | GET /api/v3/ticker/24hr |
| Candles | `<symbol>@kline_<interval>` | GET /api/v3/klines |
| Order Book | `<symbol>@depth<levels>` | GET /api/v3/depth |
| Recent Trades | `<symbol>@trade` | GET /api/v3/trades |

---

## Reliability Features

- **Reconnect:** Exponential backoff (1s, 2s, 4s, 8s, max 30s)
- **Stale detection:** Emit `STALE_DATA_DETECTED` health event if no update received within `STALE_DATA_THRESHOLD_MS`
- **Heartbeat:** WebSocket ping/pong monitoring
- **REST fallback:** On disconnect, snapshot data fetched via REST until WS reconnects

---

## Phase 2 Implementation Checklist

- [ ] ExchangeAdapter interface
- [ ] BinancePublicAdapter (WS)
- [ ] REST snapshot fallback
- [ ] Normalizers for all 4 data types
- [ ] Stale data detector
- [ ] Feed distributor (EventEmitter to subscribers)
- [ ] Unit tests for normalizers
- [ ] Integration test with live feed

*This document will be expanded after Phase 2 implementation.*

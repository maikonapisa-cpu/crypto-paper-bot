# 12 — Compliance and Boundaries

## Purpose

This document defines the legal, ethical, and operational boundaries of CryptoPaperBot. It exists to ensure every contributor and user understands what this system is and what it is not.

---

## This System Is

- A research and simulation tool
- A paper trading engine using real market data and fake funds
- A strategy validation and learning platform
- Open for personal research use

---

## This System Is Not

- A financial advisor
- A licensed trading platform
- A guarantee of profit or performance
- A copy or clone of any exchange product
- Capable of placing real trades (in v1)

---

## Disclaimers (Required in All Public-Facing Surfaces)

> Paper trading results do not guarantee live trading performance. Simulated fills assume simplified market microstructure. Slippage, spread, fees, and execution latency are modeled as configurable estimates only. Past performance of a simulated strategy is not indicative of future results. This tool is for research and educational purposes only. Nothing in this system constitutes financial advice.

---

## Exchange Data Usage

- This system uses **public, unauthenticated** endpoints only
- No exchange terms of service are violated by reading public market data
- If an exchange restricts public data access, the adapter for that exchange must be disabled
- This system does not scrape, cache, or redistribute exchange data for third parties

---

## UI and Branding

- The dashboard UI is an **original design**
- It does not use Binance, Coinbase, Kraken, or any other exchange's trademarks, logos, color schemes, or UI patterns in a way that would constitute impersonation
- The PAPER TRADING ONLY banner is permanent and non-dismissible
- No user should ever be confused about whether they are trading with real money

---

## Data Privacy

- This system stores simulated trade data locally
- In v1, no user data is transmitted to third parties
- Market data is fetched from public APIs — no personal data is sent to exchanges

---

## Contributor Guidelines

All contributors must:
1. Not add live trading functionality without an explicit, reviewed, gated extension
2. Not use private exchange API endpoints
3. Not add exchange branding to the UI
4. Not claim the system produces guaranteed returns
5. Not remove or weaken simulation disclaimers
6. Include reason codes in all strategy signals
7. Write tests for all execution logic

---

## Reporting Issues

If you discover a code path that could accidentally place a real order, treat it as a critical security issue and report it immediately. The architectural boundary between paper and live mode must be maintained at all times.

# 01 — Product Scope

## Purpose

CryptoPaperBot is a **research-grade, simulator-first crypto paper trading platform**. Its primary goal is to allow strategy researchers, developers, and traders to validate and evaluate trading logic against real market conditions without risking any real capital.

This document defines what the system is, what it is not, and the immovable constraints that govern its design.

---

## What This System Does

- Connects to **public** cryptocurrency exchange APIs and WebSocket feeds to receive real-time market data
- Maintains a **simulated ("paper") wallet** with configurable fake starting balance (default: 10,000 USDT)
- Accepts strategy signals and **simulates order fills** using documented assumptions for fees and slippage
- Tracks **open positions**, unrealized and realized PnL, and automatically exits positions at configurable take-profit levels
- Records every decision in a **full trade journal** including signal reason, entry/exit prices, fees, and PnL
- Exposes a **dashboard** with exchange-like information density for monitoring strategy behavior
- Provides **analytics** for evaluating strategy performance: win rate, drawdown, equity curve, etc.

---

## What This System Does NOT Do

- It **does not place real orders** on any exchange
- It **does not use private API keys** for any exchange account
- It **does not hold real funds** or interact with any wallet holding real assets
- It **does not guarantee profits** — simulated results are not predictive of live performance
- It **does not clone or impersonate** any exchange UI, brand, or trademark

---

## Non-Negotiable Constraints

### 1. Paper Mode Is the Only Mode
- `MODE=paper` is the default and the only supported mode in this version
- Any future live trading capability is a separate, explicitly gated extension
- No code paths in this codebase should enable live order placement

### 2. Public Data Only
- All market data comes from public, unauthenticated API endpoints
- No private endpoints, no authenticated WebSocket streams, no signed API requests

### 3. Simulation Transparency
- All simulation assumptions (fees, slippage, fill model) must be documented and configurable
- The system must never pretend to replicate exact exchange execution
- Disclaimers must be visible in the UI and in documentation

### 4. Full Auditability
- Every signal must have a reason code
- Every order must reference the signal that triggered it
- Every trade journal entry must be complete and reproducible

---

## Target Users

- **Strategy researchers** building and testing algorithmic rules
- **Developers** building trading infrastructure
- **Learners** studying market behavior and order flow without financial risk
- **Quants** back-testing and forward-testing signal ideas

---

## Out of Scope (Version 1)

- Live trading execution
- Portfolio optimization across multiple strategies
- Machine learning model integration
- Tax reporting
- Multi-user accounts
- Mobile app
- Margin / leverage simulation
- Futures / perpetuals (Version 1 focuses on spot simulation)

---

## Simulation Assumptions Summary

| Assumption | Default | Configurable |
|------------|---------|--------------|
| Starting balance | 10,000 USDT | Yes |
| Maker fee rate | 0.10% | Yes |
| Taker fee rate | 0.10% | Yes |
| Slippage (BPS) | 5 BPS | Yes |
| Take-profit trigger | +5.0% | Yes |
| Stop-loss | Disabled | Yes |
| Fill model | Mid-price + slippage | Documented |

---

## Relationship to Live Trading

This system is designed with clean separation between paper and live modes:
- All execution logic runs through an **adapter interface**
- The paper adapter is implemented; the live adapter is a stub with blocking guards
- Enabling live mode in a future version requires: `MODE=live`, live credentials, and multiple explicit safety gates
- This is described in detail in [11 — Live Trading Transition](11-live-trading-transition.md)

---

## Disclaimer

> Paper trading results do not guarantee live trading performance. Simulated fills assume simplified market microstructure. Slippage, spread, fees, and latency are modeled as configurable estimates only. This tool is for research and learning purposes. Nothing in this system constitutes financial advice.

# Atlas

**Role:** Paper Trading Agent

## Job
Watch price → make one simple decision → simulate one trade → report result.

## What Atlas does
- reads market price
- decides buy / sell / hold
- simulates the trade in paper mode
- updates fake balance
- shows the result on the dashboard

## What Atlas does not do
- no live trading
- no real money
- no complex logic
- no extra features

## Proof of concept
Atlas is working if you can see:
- current price
- current signal
- simulated trade
- balance
- PnL

## Minimum loop
1. price comes in
2. signal happens
3. fake trade executes
4. balance changes
5. dashboard updates

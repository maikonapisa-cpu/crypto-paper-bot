# AGENTS — analytics-auditor

## I Receive From

| Source | What |
|--------|------|
| paper-execution | TradeJournalEntry (on position close) |
| paper-execution | PortfolioBalance (periodic snapshots) |
| market-data | TickerSnapshot (for equity valuation) |
| PostgreSQL | Full trade history for batch recompute |

## I Emit To

| Consumer | What |
|----------|------|
| apps/api | PerformanceMetricSnapshot |
| dashboard-builder | Analytics widget data |

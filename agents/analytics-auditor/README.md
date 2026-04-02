# analytics-auditor

**Role:** Analytics and Evaluation Specialist  
**Package:** `packages/analytics/`

## Metrics Tracked

| Metric | Description |
|--------|-------------|
| Win rate | % of closed trades with net PnL > 0 |
| Average return % | Mean net PnL % per trade |
| Average win % | Mean PnL % on winning trades |
| Average loss % | Mean PnL % on losing trades |
| Profit factor | Gross wins / gross losses |
| Max drawdown | Largest peak-to-trough equity drop |
| Equity curve | Periodic portfolio value snapshots |
| Take-profit hit rate | % of trades closed by take-profit trigger |
| Signal precision | % of signals that led to profitable trades |
| Average trade duration | Mean time in trade |
| PnL by pair | Breakdown of returns per trading pair |

## Acceptance Criteria

- [ ] Analytics package computes all metrics from trade journal
- [ ] Equity snapshot stored every N seconds (configurable)
- [ ] All metrics reproducible from raw database data
- [ ] API endpoints expose analytics data
- [ ] Replay test: metrics on known dataset produce expected values
- [ ] No metric computation touches live market data adapter

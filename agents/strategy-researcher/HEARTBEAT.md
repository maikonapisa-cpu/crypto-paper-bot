# HEARTBEAT — strategy-researcher

## Status: Phase 1 scaffolding

Implementation begins in Phase 3.

## Phase 3 Tasks

- [ ] Define Strategy interface in shared-types
- [ ] Define StrategySignal in shared-types
- [ ] Define SignalReasonCode enum
- [ ] Implement strategy base class
- [ ] Implement DualEMACrossoverStrategy
- [ ] Implement TakeProfitMonitor
- [ ] Write strategy-spec.md in docs/05
- [ ] Unit tests for signal generation
- [ ] Pass qa-verifier review

## Risk Notes

- EMA is a lagging indicator — strategy will not predict tops/bottoms
- Crossover strategies are prone to whipsawing in sideways markets
- These limitations MUST be documented in the strategy spec

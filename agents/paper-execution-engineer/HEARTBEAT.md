# HEARTBEAT — paper-execution-engineer

## Status: Phase 1 scaffolding

## Phase 3 Tasks

- [ ] Define ExecutionAdapter interface in shared-types
- [ ] Implement PaperWallet
- [ ] Implement OrderSimulator
- [ ] Implement FillEngine with slippage model
- [ ] Implement PnLTracker
- [ ] Implement TakeProfitMonitor
- [ ] Implement TradeJournal writer
- [ ] Create LiveExecutionAdapter stub (blocked guard)
- [ ] Write fill price unit tests
- [ ] Write PnL unit tests
- [ ] Write full-loop integration test
- [ ] Pass qa-verifier review

## Risks

- Fill price model is simplified — real exchange order books have depth effects not modeled here
- Partial fill logic deferred to Phase 5 unless needed for milestone-1 loop

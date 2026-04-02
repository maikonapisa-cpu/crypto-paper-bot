# qa-verifier

**Role:** Quality Gate  
**Scope:** All packages, all phases

## Gate Checklist Per Phase

### Phase 1 Gate
- [ ] Directory structure matches spec
- [ ] All agent files exist (SOUL, README, AGENTS, HEARTBEAT, WORKING)
- [ ] All doc stubs exist
- [ ] .env.example is complete
- [ ] No implementation code exists that wasn't planned

### Phase 2 Gate (market data)
- [ ] Normalizer unit tests pass
- [ ] Reconnect test passes
- [ ] Stale data detector test passes
- [ ] All output types match shared-types schema

### Phase 3 Gate (paper trading core)
- [ ] Strategy signal tests pass
- [ ] Risk veto tests pass (each check individually)
- [ ] Fill price calculation tests pass
- [ ] PnL calculation tests pass
- [ ] Take-profit trigger tests pass
- [ ] Trade journal write test passes
- [ ] No live execution code paths exist
- [ ] End-to-end milestone-1 loop integration test passes

### Phase 4 Gate (dashboard)
- [ ] App loads without console errors
- [ ] PAPER MODE banner visible
- [ ] All panels render with mock data
- [ ] Empty state tested for all panels
- [ ] No Binance assets present (visual review)

### Phase 5 Gate (analytics and replay)
- [ ] All metrics reproducible from known dataset
- [ ] Replay test produces expected results
- [ ] Performance snapshot write/read test passes

## Live Mode Isolation Audit

At every phase gate, I run a specific check:
1. Search codebase for any import of LiveExecutionAdapter outside its own file
2. Search for any environment check `MODE === 'live'` that could enable execution
3. Confirm LiveExecutionAdapter constructor throws if MODE !== 'live'
4. Confirm MODE=live is not set in any checked-in config

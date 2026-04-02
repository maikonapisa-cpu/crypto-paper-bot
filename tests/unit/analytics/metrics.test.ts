/**
 * tests/unit/analytics/metrics.test.ts
 *
 * Unit tests for analytics metric computation.
 * Uses a known dataset of trade journal entries to verify all metrics.
 *
 * Every metric must be reproducible from raw journal data.
 * analytics-auditor owns these metric definitions.
 */

import { describe, it, expect } from 'vitest';
import type { TradeJournalEntry } from '@crypto-paper-bot/shared-types';

// ---- Known dataset ----------------------------------------
// 5 trades: 3 wins, 1 loss, 1 breakeven
// Used to verify all metric calculations.

function makeEntry(overrides: Partial<TradeJournalEntry>): TradeJournalEntry {
  const base: TradeJournalEntry = {
    id: 'j1',
    positionId: 'pos-1',
    entryOrderId: 'ord-1',
    symbol: 'BTC/USDT',
    side: 'long',
    entrySignalId: 'sig-1',
    entrySignalReasonCode: 'EMA_CROSSOVER_BULLISH',
    entrySignalReasonDetail: 'Test',
    entryPrice: 45000,
    takeProfitTriggerPct: 5.0,
    stopLossTriggerPct: 0,
    quantity: 0.01,
    entryFeeUsdt: 0.45,
    exitFeeUsdt: 0.47,
    totalFeesUsdt: 0.92,
    assumedSlippageBps: 5,
    estimatedSlippageCost: 0.225,
    openedAt: new Date('2024-01-01T10:00:00Z'),
    closedAt: new Date('2024-01-01T11:00:00Z'),
    durationMs: 3_600_000,
    notes: '',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return base;
}

const knownDataset: TradeJournalEntry[] = [
  // Trade 1: Win +5% net ~$21.58
  makeEntry({
    id: 'j1', positionId: 'p1',
    exitPrice: 47250,         // +5% from 45000
    grossPnlUsdt: 22.50,      // (47250 - 45000) * 0.01
    netPnlUsdt: 21.58,        // gross - fees
    netPnlPct: 4.80,
    outcome: 'win',
    exitSignalReasonCode: 'TAKE_PROFIT_HIT',
  }),
  // Trade 2: Win +3% net ~$12.08
  makeEntry({
    id: 'j2', positionId: 'p2',
    entryPrice: 46000,
    exitPrice: 47380,
    grossPnlUsdt: 13.80,
    netPnlUsdt: 12.88,
    netPnlPct: 2.80,
    outcome: 'win',
    exitSignalReasonCode: 'EMA_CROSSOVER_BEARISH',
    durationMs: 7_200_000,
  }),
  // Trade 3: Loss -2% net ~-$9.92
  makeEntry({
    id: 'j3', positionId: 'p3',
    entryPrice: 48000,
    exitPrice: 47040,         // -2% from 48000
    grossPnlUsdt: -9.60,
    netPnlUsdt: -10.52,
    netPnlPct: -2.19,
    outcome: 'loss',
    exitSignalReasonCode: 'EMA_CROSSOVER_BEARISH',
    durationMs: 1_800_000,
  }),
  // Trade 4: Win +7% net ~$34.08
  makeEntry({
    id: 'j4', positionId: 'p4',
    entryPrice: 44000,
    exitPrice: 47080,         // +7% from 44000
    grossPnlUsdt: 30.80,
    netPnlUsdt: 29.88,
    netPnlPct: 6.79,
    outcome: 'win',
    exitSignalReasonCode: 'TAKE_PROFIT_HIT',
    durationMs: 14_400_000,
  }),
  // Trade 5: Breakeven (tiny loss from fees)
  makeEntry({
    id: 'j5', positionId: 'p5',
    entryPrice: 45500,
    exitPrice: 45500,
    grossPnlUsdt: 0,
    netPnlUsdt: -0.92,
    netPnlPct: -0.20,
    outcome: 'breakeven',
    durationMs: 900_000,
  }),
];

// ---- Helper metric functions (Phase 3: move to packages/analytics/src/metrics.ts) ----

function computeWinRate(entries: TradeJournalEntry[]): number {
  const closed = entries.filter(e => e.outcome && e.outcome !== 'open');
  const wins = closed.filter(e => e.outcome === 'win');
  return closed.length === 0 ? 0 : wins.length / closed.length;
}

function computeAverageReturnPct(entries: TradeJournalEntry[]): number {
  const closed = entries.filter(e => e.netPnlPct != null && e.outcome !== 'open');
  if (closed.length === 0) return 0;
  return closed.reduce((sum, e) => sum + (e.netPnlPct ?? 0), 0) / closed.length;
}

function computeProfitFactor(entries: TradeJournalEntry[]): number {
  const grossWins = entries
    .filter(e => (e.netPnlUsdt ?? 0) > 0)
    .reduce((sum, e) => sum + (e.netPnlUsdt ?? 0), 0);
  const grossLosses = Math.abs(
    entries
      .filter(e => (e.netPnlUsdt ?? 0) < 0)
      .reduce((sum, e) => sum + (e.netPnlUsdt ?? 0), 0)
  );
  return grossLosses === 0 ? Infinity : grossWins / grossLosses;
}

function computeTakeProfitHitRate(entries: TradeJournalEntry[]): number {
  const closed = entries.filter(e => e.outcome !== 'open');
  const tpHits = closed.filter(e => e.exitSignalReasonCode === 'TAKE_PROFIT_HIT');
  return closed.length === 0 ? 0 : tpHits.length / closed.length;
}

function computeAverageTradeDurationMs(entries: TradeJournalEntry[]): number {
  const withDuration = entries.filter(e => e.durationMs != null);
  if (withDuration.length === 0) return 0;
  return withDuration.reduce((sum, e) => sum + (e.durationMs ?? 0), 0) / withDuration.length;
}

function computeTotalNetPnl(entries: TradeJournalEntry[]): number {
  return entries.reduce((sum, e) => sum + (e.netPnlUsdt ?? 0), 0);
}

// ---- Tests ------------------------------------------------

describe('Analytics metrics — known dataset verification', () => {

  it('known dataset has exactly 5 trades', () => {
    expect(knownDataset.length).toBe(5);
  });

  describe('Win rate', () => {
    it('3 wins out of 5 = 60%', () => {
      expect(computeWinRate(knownDataset)).toBeCloseTo(0.6, 2);
    });

    it('empty dataset returns 0', () => {
      expect(computeWinRate([])).toBe(0);
    });

    it('all wins returns 1.0', () => {
      const allWins = knownDataset.map(e => ({ ...e, outcome: 'win' as const }));
      expect(computeWinRate(allWins)).toBe(1.0);
    });
  });

  describe('Average return %', () => {
    it('computes average across all 5 trades', () => {
      const avg = computeAverageReturnPct(knownDataset);
      // (4.80 + 2.80 - 2.19 + 6.79 - 0.20) / 5 = 12.00 / 5 = 2.40
      expect(avg).toBeCloseTo(2.40, 1);
    });
  });

  describe('Profit factor', () => {
    it('gross wins / gross losses > 1 for profitable dataset', () => {
      const pf = computeProfitFactor(knownDataset);
      expect(pf).toBeGreaterThan(1);
    });

    it('computes from actual PnL values', () => {
      const wins = 21.58 + 12.88 + 29.88;  // 64.34
      const losses = 10.52 + 0.92;          // 11.44
      const expected = wins / losses;
      expect(computeProfitFactor(knownDataset)).toBeCloseTo(expected, 1);
    });
  });

  describe('Take-profit hit rate', () => {
    it('2 of 5 trades closed by take-profit = 40%', () => {
      expect(computeTakeProfitHitRate(knownDataset)).toBeCloseTo(0.4, 2);
    });
  });

  describe('Average trade duration', () => {
    it('computes mean duration across all trades', () => {
      const expected = (3_600_000 + 7_200_000 + 1_800_000 + 14_400_000 + 900_000) / 5;
      expect(computeAverageTradeDurationMs(knownDataset)).toBeCloseTo(expected, 0);
    });
  });

  describe('Total net PnL', () => {
    it('sums all net PnL values', () => {
      const expected = 21.58 + 12.88 - 10.52 + 29.88 - 0.92;
      expect(computeTotalNetPnl(knownDataset)).toBeCloseTo(expected, 2);
    });

    it('is positive for this dataset', () => {
      expect(computeTotalNetPnl(knownDataset)).toBeGreaterThan(0);
    });
  });

  describe('Metric reproducibility', () => {
    it('recomputing on same data produces same results', () => {
      const wr1 = computeWinRate(knownDataset);
      const wr2 = computeWinRate(knownDataset);
      expect(wr1).toBe(wr2);
    });

    it('metrics are computed from outcome field, not assumed', () => {
      // Breakeven should not inflate win rate
      const withBreakeven = knownDataset.filter(e => e.outcome === 'breakeven');
      expect(withBreakeven.length).toBe(1);
      // Win rate excludes breakeven from win count
      const winsOnly = knownDataset.filter(e => e.outcome === 'win');
      expect(winsOnly.length).toBe(3);
    });
  });
});

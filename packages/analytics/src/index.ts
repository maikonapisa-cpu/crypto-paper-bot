/**
 * packages/analytics/src/index.ts
 * Computes performance metrics from trade journal. All metrics reproducible from raw data.
 */
import type { TradeJournalEntry, PerformanceMetricSnapshot } from '@crypto-paper-bot/shared-types';
import { v4 as uuid } from 'uuid';

export function computeMetrics(
  entries: TradeJournalEntry[],
  startEquity: number,
  currentEquity: number,
  peakEquity: number,
): PerformanceMetricSnapshot {
  const closed = entries.filter(e => e.outcome && e.outcome !== 'open');
  const wins = closed.filter(e => e.outcome === 'win');
  const losses = closed.filter(e => e.outcome === 'loss');
  const open = entries.filter(e => e.outcome === 'open' || !e.closedAt);

  const grossWins = wins.reduce((s, e) => s + (e.netPnlUsdt ?? 0), 0);
  const grossLosses = Math.abs(losses.reduce((s, e) => s + (e.netPnlUsdt ?? 0), 0));

  const totalNet = closed.reduce((s, e) => s + (e.netPnlUsdt ?? 0), 0);
  const totalFees = closed.reduce((s, e) => s + e.totalFeesUsdt, 0);

  const avgReturn = closed.length > 0
    ? closed.reduce((s, e) => s + (e.netPnlPct ?? 0), 0) / closed.length : 0;
  const avgWin = wins.length > 0
    ? wins.reduce((s, e) => s + (e.netPnlPct ?? 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0
    ? losses.reduce((s, e) => s + (e.netPnlPct ?? 0), 0) / losses.length : 0;

  const avgDuration = closed.length > 0
    ? closed.reduce((s, e) => s + (e.durationMs ?? 0), 0) / closed.length : 0;

  const tpHits = closed.filter(e => e.exitSignalReasonCode === 'TAKE_PROFIT_HIT').length;

  const maxDdPct = computeMaxDrawdown(entries, startEquity);

  const now = new Date();
  return {
    id: uuid(),
    snapshotAt: now,
    periodStart: entries.length > 0 ? entries[0]!.openedAt : now,
    periodEnd: now,
    totalTrades: closed.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    openTrades: open.length,
    winRate: closed.length > 0 ? wins.length / closed.length : 0,
    averageReturnPct: avgReturn,
    averageWinPct: avgWin,
    averageLossPct: avgLoss,
    profitFactor: grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0,
    maxDrawdownPct: maxDdPct,
    maxDrawdownUsdt: (maxDdPct / 100) * peakEquity,
    averageTradeDurationMs: avgDuration,
    takeProfitHitRate: closed.length > 0 ? tpHits / closed.length : 0,
    totalNetPnlUsdt: totalNet,
    totalFeesUsdt: totalFees,
    startEquityUsdt: startEquity,
    endEquityUsdt: currentEquity,
    peakEquityUsdt: peakEquity,
  };
}

function computeMaxDrawdown(entries: TradeJournalEntry[], startEquity: number): number {
  let equity = startEquity;
  let peak = startEquity;
  let maxDd = 0;
  for (const e of entries) {
    equity += e.netPnlUsdt ?? 0;
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    if (dd > maxDd) maxDd = dd;
  }
  return maxDd;
}

export type { PerformanceMetricSnapshot };

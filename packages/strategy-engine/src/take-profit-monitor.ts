/**
 * packages/strategy-engine/src/take-profit-monitor.ts
 * Watches open positions on every ticker event and fires TAKE_PROFIT_HIT signals.
 */
import { v4 as uuid } from 'uuid';
import type { TickerSnapshot, OpenPosition, StrategySignal } from '@crypto-paper-bot/shared-types';

export class TakeProfitMonitor {
  constructor(private readonly takeProfitPct: number, private readonly stopLossPct: number) {}

  check(ticker: TickerSnapshot, positions: OpenPosition[]): StrategySignal[] {
    const signals: StrategySignal[] = [];
    const now = new Date();

    for (const pos of positions) {
      if (pos.status !== 'open' || pos.symbol !== ticker.symbol) continue;

      const pnlPct = ((ticker.midPrice - pos.entryPrice) / pos.entryPrice) * 100;

      if (pnlPct >= this.takeProfitPct) {
        signals.push({
          id: uuid(),
          strategyId: 'take-profit-monitor',
          symbol: pos.symbol,
          timestamp: now,
          action: 'close',
          confidence: 1.0,
          reasonCode: 'TAKE_PROFIT_HIT',
          reasonDetail:
            `Position ${pos.id} unrealized PnL ${pnlPct.toFixed(2)}% ` +
            `>= take-profit threshold ${this.takeProfitPct}%. ` +
            `Entry: ${pos.entryPrice}, Current: ${ticker.midPrice}. ` +
            `Auto-closing position. This is a rule, not a guarantee of net profit.`,
          referencePrice: ticker.midPrice,
          indicatorSnapshot: {
            unrealizedPnlPct: pnlPct,
            entryPrice: pos.entryPrice,
            currentPrice: ticker.midPrice,
            threshold: this.takeProfitPct,
          },
          ttlMs: 5000,
          expiresAt: new Date(now.getTime() + 5000),
        });
      } else if (this.stopLossPct > 0 && pnlPct <= -this.stopLossPct) {
        signals.push({
          id: uuid(),
          strategyId: 'take-profit-monitor',
          symbol: pos.symbol,
          timestamp: now,
          action: 'close',
          confidence: 1.0,
          reasonCode: 'STOP_LOSS_HIT',
          reasonDetail:
            `Position ${pos.id} unrealized PnL ${pnlPct.toFixed(2)}% ` +
            `<= stop-loss threshold -${this.stopLossPct}%. Auto-closing.`,
          referencePrice: ticker.midPrice,
          indicatorSnapshot: { unrealizedPnlPct: pnlPct, threshold: -this.stopLossPct },
          ttlMs: 5000,
          expiresAt: new Date(now.getTime() + 5000),
        });
      }
    }

    return signals;
  }
}

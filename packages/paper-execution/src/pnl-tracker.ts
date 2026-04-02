/**
 * packages/paper-execution/src/pnl-tracker.ts
 * Tracks open positions and computes PnL on every ticker update.
 */
import { v4 as uuid } from 'uuid';
import type { OpenPosition, TickerSnapshot, SimulatedFill } from '@crypto-paper-bot/shared-types';

export class PnLTracker {
  private positions: Map<string, OpenPosition> = new Map();

  openPosition(
    entryOrderId: string,
    entrySignalId: string,
    fill: SimulatedFill,
  ): OpenPosition {
    const pos: OpenPosition = {
      id: uuid(),
      symbol: fill.symbol,
      side: 'long',
      entryOrderId,
      status: 'open',
      quantity: fill.quantity,
      entryPrice: fill.fillPrice,
      currentPrice: fill.fillPrice,
      unrealizedPnl: 0,
      unrealizedPnlPct: 0,
      totalFeesPaid: fill.feeApplied,
      openedAt: new Date(),
    };
    void entrySignalId; // stored in journal, not position
    this.positions.set(pos.id, pos);
    return pos;
  }

  onTicker(ticker: TickerSnapshot): OpenPosition[] {
    const updated: OpenPosition[] = [];
    for (const [, pos] of this.positions) {
      if (pos.status !== 'open' || pos.symbol !== ticker.symbol) continue;
      pos.currentPrice = ticker.midPrice;
      pos.unrealizedPnl = (ticker.midPrice - pos.entryPrice) * pos.quantity - pos.totalFeesPaid;
      pos.unrealizedPnlPct = ((ticker.midPrice - pos.entryPrice) / pos.entryPrice) * 100;
      updated.push({ ...pos });
    }
    return updated;
  }

  closePosition(
    positionId: string,
    exitFill: SimulatedFill,
    closedBySignalId: string,
    closedByReason: string,
  ): OpenPosition {
    const pos = this.positions.get(positionId);
    if (!pos) throw new Error(`Position ${positionId} not found`);

    pos.status = 'closed';
    pos.closedAt = new Date();
    pos.exitPrice = exitFill.fillPrice;
    pos.closedBySignalId = closedBySignalId;
    pos.closedByReason = closedByReason;
    pos.totalFeesPaid += exitFill.feeApplied;
    pos.realizedPnl =
      (exitFill.fillPrice - pos.entryPrice) * pos.quantity - pos.totalFeesPaid;
    pos.unrealizedPnl = 0;
    pos.unrealizedPnlPct = 0;

    this.positions.delete(positionId);
    return { ...pos };
  }

  getOpenPositions(): OpenPosition[] {
    return [...this.positions.values()].map(p => ({ ...p }));
  }

  getOpenPositionForSymbol(symbol: string): OpenPosition | undefined {
    for (const pos of this.positions.values()) {
      if (pos.symbol === symbol && pos.status === 'open') return { ...pos };
    }
    return undefined;
  }

  getTotalUnrealizedPnl(): number {
    let total = 0;
    for (const pos of this.positions.values()) total += pos.unrealizedPnl;
    return total;
  }

  getLockedValue(): number {
    let total = 0;
    for (const pos of this.positions.values()) {
      total += pos.quantity * pos.entryPrice;
    }
    return total;
  }
}

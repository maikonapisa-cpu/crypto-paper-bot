/**
 * packages/paper-execution/src/fill-engine.ts
 *
 * Fill price model (documented in docs/03-paper-trading-engine.md):
 *   midPrice           = (bid + ask) / 2
 *   slippageAdj        = midPrice × (slippageBps / 10_000)
 *   fillPrice (buy)    = midPrice + slippageAdj
 *   fillPrice (sell)   = midPrice - slippageAdj
 *   fee                = fillPrice × quantity × feeRate
 *   totalCost (buy)    = fillPrice × qty + fee
 *   netReceived (sell) = fillPrice × qty - fee
 */

import { v4 as uuid } from 'uuid';
import type { SimulatedFill, TickerSnapshot, OrderSide } from '@crypto-paper-bot/shared-types';

export class FillEngine {
  constructor(
    private readonly feeRate: number,
    private readonly slippageBps: number,
  ) {}

  compute(
    orderId: string,
    side: OrderSide,
    quantity: number,
    ticker: TickerSnapshot,
  ): SimulatedFill & { totalCost: number } {
    const { bidPrice, askPrice } = ticker;
    const midPrice = (bidPrice + askPrice) / 2;
    const slippageAdj = midPrice * (this.slippageBps / 10_000);

    const fillPrice = side === 'buy'
      ? midPrice + slippageAdj
      : midPrice - slippageAdj;

    const fee = fillPrice * quantity * this.feeRate;
    const totalCost = side === 'buy'
      ? fillPrice * quantity + fee   // USDT out
      : fillPrice * quantity - fee;  // USDT in (net)

    return {
      id: uuid(),
      orderId,
      symbol: ticker.symbol,
      side,
      quantity,
      fillPrice,
      midPriceAtFill: midPrice,
      slippageApplied: slippageAdj,
      feeApplied: fee,
      feeRate: this.feeRate,
      totalCost,
      filledAt: new Date(),
    };
  }
}

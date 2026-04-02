/**
 * tests/unit/paper-execution/fill-engine.test.ts
 *
 * Unit tests for the FillEngine fill price model.
 *
 * Verifies:
 *   - Fill price calculation (mid-price + slippage)
 *   - Fee calculation
 *   - Total cost = fillPrice * qty + fee
 *   - BUY fills at mid + slippage (adverse)
 *   - SELL fills at mid - slippage (adverse)
 *   - Slippage scales with BPS setting
 *   - Fee scales with rate setting
 */

import { describe, it, expect } from 'vitest';

// Phase 3: Uncomment when FillEngine is implemented
// import { FillEngine } from '../../../packages/paper-execution/src/fill-engine';

// ---- Documented fill price model (from docs/03-paper-trading-engine.md) ----
//
// midPrice            = (bid + ask) / 2
// slippageAdjustment  = midPrice × (slippageBps / 10_000)
// fillPrice (buy)     = midPrice + slippageAdjustment
// fillPrice (sell)    = midPrice - slippageAdjustment
// fee                 = fillPrice × quantity × feeRate
// totalCost (buy)     = (fillPrice × quantity) + fee
// netReceived (sell)  = (fillPrice × quantity) - fee
//
// This model is the specification. The FillEngine implementation must match it.

function computeExpectedFill(
  side: 'buy' | 'sell',
  bid: number,
  ask: number,
  quantity: number,
  slippageBps: number,
  feeRate: number,
) {
  const midPrice = (bid + ask) / 2;
  const slippageAdj = midPrice * (slippageBps / 10_000);
  const fillPrice = side === 'buy' ? midPrice + slippageAdj : midPrice - slippageAdj;
  const fee = fillPrice * quantity * feeRate;
  const totalCost = side === 'buy'
    ? fillPrice * quantity + fee
    : fillPrice * quantity - fee;
  return { midPrice, slippageAdj, fillPrice, fee, totalCost };
}

describe('Fill price model (specification tests)', () => {

  describe('BUY side', () => {
    it('fill price is mid-price + slippage', () => {
      const { midPrice, slippageAdj, fillPrice } = computeExpectedFill('buy', 44990, 45010, 0.01, 5, 0.001);
      expect(midPrice).toBe(45000);
      expect(slippageAdj).toBeCloseTo(45000 * 0.0005, 6);
      expect(fillPrice).toBeCloseTo(45000 + 45000 * 0.0005, 6);
    });

    it('fee is applied to fill price × quantity', () => {
      const { fillPrice, fee } = computeExpectedFill('buy', 44990, 45010, 0.01, 5, 0.001);
      expect(fee).toBeCloseTo(fillPrice * 0.01 * 0.001, 8);
    });

    it('total cost = fillPrice × qty + fee (buy)', () => {
      const { fillPrice, fee, totalCost } = computeExpectedFill('buy', 44990, 45010, 0.01, 5, 0.001);
      expect(totalCost).toBeCloseTo(fillPrice * 0.01 + fee, 8);
    });
  });

  describe('SELL side', () => {
    it('fill price is mid-price - slippage (adverse for seller)', () => {
      const { midPrice, fillPrice } = computeExpectedFill('sell', 44990, 45010, 0.01, 5, 0.001);
      expect(fillPrice).toBeLessThan(midPrice);
    });

    it('net received = fillPrice × qty - fee (sell)', () => {
      const { fillPrice, fee, totalCost } = computeExpectedFill('sell', 44990, 45010, 0.01, 5, 0.001);
      expect(totalCost).toBeCloseTo(fillPrice * 0.01 - fee, 8);
    });
  });

  describe('Slippage scaling', () => {
    it('zero slippage produces fill at exact mid-price', () => {
      const { midPrice, fillPrice } = computeExpectedFill('buy', 44990, 45010, 0.01, 0, 0.001);
      expect(fillPrice).toBeCloseTo(midPrice, 8);
    });

    it('higher BPS produces higher fill price for buys', () => {
      const low = computeExpectedFill('buy', 44990, 45010, 0.01, 5, 0.001);
      const high = computeExpectedFill('buy', 44990, 45010, 0.01, 20, 0.001);
      expect(high.fillPrice).toBeGreaterThan(low.fillPrice);
    });

    it('100 BPS = 1% slippage applied to mid-price', () => {
      const { midPrice, slippageAdj } = computeExpectedFill('buy', 44990, 45010, 0.01, 100, 0.001);
      expect(slippageAdj).toBeCloseTo(midPrice * 0.01, 6);
    });
  });

  describe('Fee scaling', () => {
    it('zero fee rate produces no fee', () => {
      const { fee } = computeExpectedFill('buy', 44990, 45010, 0.01, 5, 0);
      expect(fee).toBe(0);
    });

    it('fee doubles when rate doubles', () => {
      const low = computeExpectedFill('buy', 44990, 45010, 0.01, 5, 0.001);
      const high = computeExpectedFill('buy', 44990, 45010, 0.01, 5, 0.002);
      expect(high.fee).toBeCloseTo(low.fee * 2, 8);
    });
  });

  describe('PnL verification', () => {
    it('net PnL = gross PnL - total fees', () => {
      const qty = 0.01;
      const entryBid = 44990, entryAsk = 45010;
      const exitBid = 47240, exitAsk = 47260;
      const slippageBps = 5, feeRate = 0.001;

      const entry = computeExpectedFill('buy', entryBid, entryAsk, qty, slippageBps, feeRate);
      const exit = computeExpectedFill('sell', exitBid, exitAsk, qty, slippageBps, feeRate);

      const grossPnl = (exit.fillPrice - entry.fillPrice) * qty;
      const totalFees = entry.fee + exit.fee;
      const netPnl = grossPnl - totalFees;

      // At ~+5% move: exitFillPrice ~= 45000 * 1.05 = 47250
      expect(exit.fillPrice).toBeGreaterThan(entry.fillPrice);
      expect(grossPnl).toBeGreaterThan(0);
      expect(netPnl).toBeLessThan(grossPnl); // fees reduce net PnL
      expect(netPnl).toBeGreaterThan(0);     // still profitable after fees
    });
  });
});

// ---- Phase 3: Integration against FillEngine class ----
//
// Once FillEngine is implemented in packages/paper-execution/src/fill-engine.ts,
// add tests like:
//
// describe('FillEngine class', () => {
//   it('produces fill matching the documented model', async () => {
//     const engine = new FillEngine({ feeRate: 0.001, slippageBps: 5 });
//     const ticker = { bidPrice: 44990, askPrice: 45010, ... };
//     const fill = engine.computeFill({ side: 'buy', quantity: 0.01, ticker, orderId: '...' });
//     const expected = computeExpectedFill('buy', 44990, 45010, 0.01, 5, 0.001);
//     expect(fill.fillPrice).toBeCloseTo(expected.fillPrice, 6);
//     expect(fill.feeApplied).toBeCloseTo(expected.fee, 8);
//   });
// });

/**
 * packages/strategy-engine/src/indicators/ema.ts
 *
 * Exponential Moving Average — proper implementation.
 * k = 2 / (period + 1)
 * EMA[i] = price[i] * k + EMA[i-1] * (1 - k)
 * Seeded with SMA of first `period` values.
 */

export class EMACalculator {
  private values: number[] = [];
  private currentEma: number | null = null;
  private readonly k: number;

  constructor(private readonly period: number) {
    this.k = 2 / (period + 1);
  }

  /** Feed one value. Returns current EMA or null if not enough data yet. */
  update(value: number): number | null {
    this.values.push(value);

    if (this.values.length < this.period) {
      return null; // not enough data
    }

    if (this.currentEma === null) {
      // Seed: use SMA of first `period` values
      const sum = this.values.slice(0, this.period).reduce((a, b) => a + b, 0);
      this.currentEma = sum / this.period;
    } else {
      this.currentEma = value * this.k + this.currentEma * (1 - this.k);
    }

    return this.currentEma;
  }

  get current(): number | null { return this.currentEma; }
  get ready(): boolean { return this.currentEma !== null; }
  reset(): void { this.values = []; this.currentEma = null; }
}

/** Stateless: compute EMA over a full price array. Returns null if insufficient data. */
export function computeEMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const calc = new EMACalculator(period);
  let result: number | null = null;
  for (const p of prices) result = calc.update(p);
  return result;
}

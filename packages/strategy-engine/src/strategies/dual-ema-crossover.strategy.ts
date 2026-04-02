import { v4 as uuid } from 'uuid';
import { EMACalculator } from '../indicators/ema';
import type {
  Strategy, StrategyConfig, StrategyState, StrategySignal,
  Candle, TickerSnapshot,
} from '@crypto-paper-bot/shared-types';

export interface DualEMAConfig {
  fastPeriod: number;
  slowPeriod: number;
  takeProfitPct: number;
  stopLossPct: number;
}

export class DualEMACrossoverStrategy implements Strategy {
  readonly id = 'dual-ema-crossover';
  readonly name = 'Dual EMA Crossover';
  readonly description =
    'Buy on bullish EMA crossover, close on bearish. DISCLAIMER: lagging indicator, not a profit guarantee.';

  private fastEma: EMACalculator;
  private slowEma: EMACalculator;
  private prevFast: number | null = null;
  private prevSlow: number | null = null;

  constructor(private readonly config: DualEMAConfig) {
    this.fastEma = new EMACalculator(config.fastPeriod);
    this.slowEma = new EMACalculator(config.slowPeriod);
  }

  getConfig(): StrategyConfig {
    return {
      strategyId: this.id,
      name: this.name,
      description: this.description,
      params: { fastPeriod: this.config.fastPeriod, slowPeriod: this.config.slowPeriod },
      takeProfitPct: this.config.takeProfitPct,
      stopLossPct: this.config.stopLossPct,
    };
  }

  onCandle(candle: Candle, _state: StrategyState): StrategySignal | null {
    if (!candle.isClosed) return null;
    const fast = this.fastEma.update(candle.close);
    const slow = this.slowEma.update(candle.close);
    if (fast === null || slow === null) return null;

    let signal: StrategySignal | null = null;
    if (this.prevFast !== null && this.prevSlow !== null) {
      if (this.prevFast <= this.prevSlow && fast > slow) {
        signal = this.buildSignal(candle, 'buy', 'EMA_CROSSOVER_BULLISH', fast, slow);
      } else if (this.prevFast >= this.prevSlow && fast < slow) {
        signal = this.buildSignal(candle, 'sell', 'EMA_CROSSOVER_BEARISH', fast, slow);
      }
    }
    this.prevFast = fast;
    this.prevSlow = slow;
    return signal;
  }

  onTicker(_ticker: TickerSnapshot, _state: StrategyState): StrategySignal | null { return null; }

  reset(): void {
    this.fastEma.reset(); this.slowEma.reset();
    this.prevFast = null; this.prevSlow = null;
  }

  private buildSignal(candle: Candle, action: 'buy' | 'sell',
    reasonCode: 'EMA_CROSSOVER_BULLISH' | 'EMA_CROSSOVER_BEARISH',
    fast: number, slow: number): StrategySignal {
    const now = new Date();
    const ttlMs = 10_000;
    return {
      id: uuid(), strategyId: this.id, symbol: candle.symbol,
      timestamp: now, action, confidence: 0.6,
      reasonCode, referencePrice: candle.close,
      reasonDetail: `EMA(${this.config.fastPeriod})=${fast.toFixed(2)} ` +
        `${action === 'buy' ? 'crossed above' : 'crossed below'} ` +
        `EMA(${this.config.slowPeriod})=${slow.toFixed(2)} @ ${candle.close}. ` +
        `DISCLAIMER: Lagging indicator. Not a profit guarantee.`,
      indicatorSnapshot: { fastEma: fast, slowEma: slow, close: candle.close },
      ttlMs, expiresAt: new Date(now.getTime() + ttlMs),
    };
  }
}

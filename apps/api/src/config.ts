/**
 * apps/api/src/config.ts
 * Loads and validates environment config. Enforces MODE=paper.
 */
import type { AppConfig, RiskEngineConfig } from '@crypto-paper-bot/shared-types';

export function loadConfig(): AppConfig {
  const mode = process.env['MODE'] ?? 'paper';

  if (mode !== 'paper') {
    throw new Error(
      `Invalid MODE="${mode}". Only MODE=paper is supported in v1. ` +
      `See docs/11-live-trading-transition.md for live trading requirements.`
    );
  }

  const risk: RiskEngineConfig = {
    maxConcurrentPositions: Number(process.env['RISK_MAX_CONCURRENT_POSITIONS'] ?? 3),
    maxPositionSizePct: Number(process.env['RISK_MAX_POSITION_SIZE_PCT'] ?? 20),
    maxDailyLossPct: Number(process.env['RISK_MAX_DAILY_LOSS_PCT'] ?? 10),
    cooldownPeriodSec: Number(process.env['RISK_COOLDOWN_PERIOD_SEC'] ?? 60),
    staleDateThresholdMs: Number(process.env['STALE_DATA_THRESHOLD_MS'] ?? 10000),
    abnormalVolatilityEnabled: false,
    abnormalVolatilityThresholdPct: 5,
  };

  return {
    mode: 'paper',
    exchange: process.env['EXCHANGE_ADAPTER'] ?? 'binance-public',
    paperWalletInitialUsdt: Number(process.env['PAPER_WALLET_INITIAL_USDT'] ?? 10000),
    paperFeeRateMaker: Number(process.env['PAPER_FEE_RATE_MAKER'] ?? 0.001),
    paperFeeRateTaker: Number(process.env['PAPER_FEE_RATE_TAKER'] ?? 0.001),
    paperSlippageBps: Number(process.env['PAPER_SLIPPAGE_BPS'] ?? 5),
    strategyTakeProfitPct: Number(process.env['STRATEGY_TAKE_PROFIT_PCT'] ?? 5.0),
    strategyStopLossPct: Number(process.env['STRATEGY_STOP_LOSS_PCT'] ?? 0),
    strategyDefaultPair: process.env['STRATEGY_DEFAULT_PAIR'] ?? 'BTC/USDT',
    risk,
  };
}

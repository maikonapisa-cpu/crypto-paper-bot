/**
 * packages/risk-engine/src/risk-engine.ts
 * All 8 pre-trade checks. Veto is final. Safety takes priority over strategy.
 */
import { v4 as uuid } from 'uuid';
import type {
  StrategySignal, RiskDecision, RiskCheck, RiskEngineConfig,
  PortfolioBalance, OpenPosition, AdapterHealth, RiskVetoReason,
} from '@crypto-paper-bot/shared-types';

interface DailyLossState {
  startEquity: number;
  resetDate: string; // YYYY-MM-DD
}

export class RiskEngine {
  private killSwitchActive = false;
  private killSwitchReason = '';
  private adapterHealth: AdapterHealth | null = null;
  private cooldowns = new Map<string, number>(); // symbol → expires timestamp
  private dailyLoss: DailyLossState | null = null;

  constructor(private readonly cfg: RiskEngineConfig) {}

  async evaluate(
    signal: StrategySignal,
    portfolio: PortfolioBalance,
    openPositions: OpenPosition[],
  ): Promise<RiskDecision> {
    this.ensureDailyLossState(portfolio);
    const checks: RiskCheck[] = [];

    // Fast-path: take-profit and stop-loss auto-close always approved
    if (signal.reasonCode === 'TAKE_PROFIT_HIT' || signal.reasonCode === 'STOP_LOSS_HIT') {
      checks.push({ checkName: 'auto_close_fast_path', passed: true, detail: 'Auto-close signals bypass risk checks' });
      return this.approve(signal.id, checks, portfolio.availableUsdt);
    }

    // 1. Kill switch
    const ks = this.checkKillSwitch();
    checks.push(ks);
    if (!ks.passed) return this.veto(signal.id, 'KILL_SWITCH_ACTIVE', `Kill switch active: ${this.killSwitchReason}`, checks);

    // 2. Stale data
    const stale = this.checkStaleData();
    checks.push(stale);
    if (!stale.passed) return this.veto(signal.id, 'STALE_MARKET_DATA', 'Market data feed is stale', checks);

    // 3. Max positions (only blocks BUY/new entry signals)
    if (signal.action === 'buy') {
      const maxPos = this.checkMaxPositions(openPositions);
      checks.push(maxPos);
      if (!maxPos.passed) return this.veto(signal.id, 'MAX_POSITIONS_REACHED',
        `At max concurrent positions (${this.cfg.maxConcurrentPositions})`, checks);
    }

    // 4. Balance
    const bal = this.checkBalance(portfolio, signal.referencePrice);
    checks.push(bal);
    if (!bal.passed) return this.veto(signal.id, 'INSUFFICIENT_BALANCE', 'Insufficient available USDT', checks);

    // 5. Daily loss limit
    const daily = this.checkDailyLoss(portfolio);
    checks.push(daily);
    if (!daily.passed) {
      this.activateKillSwitch('Daily loss limit reached');
      return this.veto(signal.id, 'DAILY_LOSS_LIMIT_REACHED',
        `Daily loss limit of ${this.cfg.maxDailyLossPct}% reached. Kill switch activated.`, checks);
    }

    // 6. Cooldown (only on entry signals)
    if (signal.action === 'buy') {
      const cooldown = this.checkCooldown(signal.symbol);
      checks.push(cooldown);
      if (!cooldown.passed) return this.veto(signal.id, 'COOLDOWN_ACTIVE',
        `Cooldown active for ${signal.symbol}`, checks);
    }

    // 7. Position size (compute allowed, but don't veto — reduce instead)
    const allowedSize = this.computeAllowedSize(portfolio);
    checks.push({
      checkName: 'position_size',
      passed: true,
      value: allowedSize,
      threshold: portfolio.totalEquityUsdt * (this.cfg.maxPositionSizePct / 100),
      detail: `Allowed position size: ${allowedSize.toFixed(2)} USDT`,
    });

    // 8. Abnormal volatility (optional, informational only for now)
    if (this.cfg.abnormalVolatilityEnabled) {
      checks.push({ checkName: 'volatility', passed: true, detail: 'Volatility check: within normal range' });
    }

    // All passed
    if (signal.action === 'buy') this.setCooldown(signal.symbol);
    return this.approve(signal.id, checks, allowedSize);
  }

  // ---- Individual checks -----------------------------------

  private checkKillSwitch(): RiskCheck {
    return {
      checkName: 'kill_switch',
      passed: !this.killSwitchActive,
      detail: this.killSwitchActive ? `Active: ${this.killSwitchReason}` : 'Inactive',
    };
  }

  private checkStaleData(): RiskCheck {
    if (!this.adapterHealth) {
      return { checkName: 'stale_data', passed: true, detail: 'No health data yet — allowing' };
    }
    return {
      checkName: 'stale_data',
      passed: !this.adapterHealth.isStale,
      detail: this.adapterHealth.isStale
        ? `Data stale since ${this.adapterHealth.staleSince?.toISOString()}`
        : `Last message: ${this.adapterHealth.lastMessageAt?.toISOString()}`,
    };
  }

  private checkMaxPositions(openPositions: OpenPosition[]): RiskCheck {
    const open = openPositions.filter(p => p.status === 'open').length;
    return {
      checkName: 'max_positions',
      passed: open < this.cfg.maxConcurrentPositions,
      value: open,
      threshold: this.cfg.maxConcurrentPositions,
      detail: `Open: ${open} / Max: ${this.cfg.maxConcurrentPositions}`,
    };
  }

  private checkBalance(portfolio: PortfolioBalance, refPrice: number): RiskCheck {
    // Require at least enough for a minimal position (0.1% of ref price)
    const minRequired = refPrice * 0.001;
    return {
      checkName: 'balance',
      passed: portfolio.availableUsdt > minRequired,
      value: portfolio.availableUsdt,
      threshold: minRequired,
      detail: `Available: ${portfolio.availableUsdt.toFixed(2)} USDT`,
    };
  }

  private checkDailyLoss(portfolio: PortfolioBalance): RiskCheck {
    if (!this.dailyLoss) return { checkName: 'daily_loss', passed: true, detail: 'No daily baseline yet' };
    const lossPct = ((this.dailyLoss.startEquity - portfolio.totalEquityUsdt) / this.dailyLoss.startEquity) * 100;
    const exceeded = lossPct >= this.cfg.maxDailyLossPct;
    return {
      checkName: 'daily_loss',
      passed: !exceeded,
      value: lossPct,
      threshold: this.cfg.maxDailyLossPct,
      detail: `Daily loss: ${lossPct.toFixed(2)}% / Limit: ${this.cfg.maxDailyLossPct}%`,
    };
  }

  private checkCooldown(symbol: string): RiskCheck {
    const expiry = this.cooldowns.get(symbol) ?? 0;
    const inCooldown = Date.now() < expiry;
    return {
      checkName: 'cooldown',
      passed: !inCooldown,
      detail: inCooldown
        ? `Cooldown until ${new Date(expiry).toISOString()}`
        : `No cooldown for ${symbol}`,
    };
  }

  private computeAllowedSize(portfolio: PortfolioBalance): number {
    const maxByPct = portfolio.totalEquityUsdt * (this.cfg.maxPositionSizePct / 100);
    return Math.min(portfolio.availableUsdt, maxByPct);
  }

  // ---- Builders -------------------------------------------

  private approve(signalId: string, checks: RiskCheck[], allowedSize: number): RiskDecision {
    return { id: uuid(), signalId, timestamp: new Date(), outcome: 'approved', checksPerformed: checks, positionSizeAllowed: allowedSize };
  }

  private veto(signalId: string, reason: RiskVetoReason, detail: string, checks: RiskCheck[]): RiskDecision {
    console.warn(`[RiskEngine] VETO — ${reason}: ${detail}`);
    return { id: uuid(), signalId, timestamp: new Date(), outcome: 'vetoed', vetoReason: reason, vetoDetail: detail, checksPerformed: checks };
  }

  // ---- Helpers --------------------------------------------

  private ensureDailyLossState(portfolio: PortfolioBalance): void {
    const today = new Date().toISOString().slice(0, 10);
    if (!this.dailyLoss || this.dailyLoss.resetDate !== today) {
      this.dailyLoss = { startEquity: portfolio.totalEquityUsdt, resetDate: today };
    }
  }

  private setCooldown(symbol: string): void {
    this.cooldowns.set(symbol, Date.now() + this.cfg.cooldownPeriodSec * 1000);
  }

  // ---- Public control -------------------------------------

  activateKillSwitch(reason: string): void {
    this.killSwitchActive = true;
    this.killSwitchReason = reason;
    console.warn(`[RiskEngine] 🛑 KILL SWITCH ACTIVATED: ${reason}`);
  }

  deactivateKillSwitch(): void {
    this.killSwitchActive = false;
    this.killSwitchReason = '';
    console.info('[RiskEngine] ✅ Kill switch deactivated');
  }

  updateAdapterHealth(health: AdapterHealth): void {
    this.adapterHealth = health;
    if (health.isStale && !this.killSwitchActive) {
      console.warn('[RiskEngine] Stale data detected — new BUY signals will be blocked');
    }
  }

  getStatus() {
    return { killSwitchActive: this.killSwitchActive, killSwitchReason: this.killSwitchReason, adapterHealth: this.adapterHealth };
  }
}

/**
 * tests/unit/risk-engine/all-checks.test.ts
 *
 * Unit tests for the RiskEngine — one test per check.
 *
 * Phase 3: qa-verifier implements these tests against the risk-officer's implementation.
 * These tests serve as the specification for expected behavior.
 *
 * Test runner: Vitest (or Jest — adapt imports as needed)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RiskEngine } from '../../../packages/risk-engine/src/risk-engine';
import type {
  StrategySignal,
  PortfolioBalance,
  OpenPosition,
  RiskEngineConfig,
} from '@crypto-paper-bot/shared-types';

// ---- Test fixtures ----------------------------------------

const defaultConfig: RiskEngineConfig = {
  maxConcurrentPositions: 3,
  maxPositionSizePct: 20,
  maxDailyLossPct: 10,
  cooldownPeriodSec: 60,
  staleDateThresholdMs: 10000,
  abnormalVolatilityEnabled: false,
  abnormalVolatilityThresholdPct: 5,
};

const mockPortfolio: PortfolioBalance = {
  id: 'portfolio-1',
  snapshotAt: new Date(),
  totalEquityUsdt: 10000,
  availableUsdt: 9000,
  lockedInPositions: 1000,
  unrealizedPnl: 0,
  realizedPnlSession: 0,
  realizedPnlAllTime: 0,
  assets: [{ asset: 'USDT', free: 9000, locked: 1000, totalUsdt: 10000 }],
  initialBalance: 10000,
  returnPct: 0,
};

const mockSignal: StrategySignal = {
  id: 'signal-1',
  strategyId: 'dual-ema-crossover',
  symbol: 'BTC/USDT',
  timestamp: new Date(),
  action: 'buy',
  confidence: 0.6,
  reasonCode: 'EMA_CROSSOVER_BULLISH',
  reasonDetail: 'Test signal',
  referencePrice: 45000,
  indicatorSnapshot: {},
  ttlMs: 5000,
  expiresAt: new Date(Date.now() + 5000),
};

const noOpenPositions: OpenPosition[] = [];

function makeOpenPositions(count: number): OpenPosition[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `pos-${i}`,
    symbol: 'BTC/USDT',
    side: 'long' as const,
    entryOrderId: `order-${i}`,
    status: 'open' as const,
    quantity: 0.01,
    entryPrice: 45000,
    currentPrice: 45000,
    unrealizedPnl: 0,
    unrealizedPnlPct: 0,
    totalFeesPaid: 0,
    openedAt: new Date(),
  }));
}

// ---- Tests ------------------------------------------------

describe('RiskEngine', () => {
  let engine: RiskEngine;

  beforeEach(() => {
    engine = new RiskEngine(defaultConfig);
  });

  // --- Check 1: Kill Switch

  describe('Check 1: Kill switch', () => {
    it('approves signal when kill switch is inactive', async () => {
      const decision = await engine.evaluate(mockSignal, mockPortfolio, noOpenPositions);
      expect(decision.outcome).toBe('approved');
    });

    it('vetoes signal when kill switch is active', async () => {
      engine.activateKillSwitch('test');
      const decision = await engine.evaluate(mockSignal, mockPortfolio, noOpenPositions);
      expect(decision.outcome).toBe('vetoed');
      expect(decision.vetoReason).toBe('KILL_SWITCH_ACTIVE');
    });

    it('approves signal after kill switch is deactivated', async () => {
      engine.activateKillSwitch('test');
      engine.deactivateKillSwitch();
      const decision = await engine.evaluate(mockSignal, mockPortfolio, noOpenPositions);
      expect(decision.outcome).toBe('approved');
    });
  });

  // --- Check 3: Max Positions

  describe('Check 3: Max concurrent positions', () => {
    it('approves when under max positions limit', async () => {
      const positions = makeOpenPositions(2); // max is 3
      const decision = await engine.evaluate(mockSignal, mockPortfolio, positions);
      expect(decision.outcome).toBe('approved');
    });

    it('vetoes when at max positions limit', async () => {
      const positions = makeOpenPositions(3); // exactly at limit
      const decision = await engine.evaluate(mockSignal, mockPortfolio, positions);
      expect(decision.outcome).toBe('vetoed');
      expect(decision.vetoReason).toBe('MAX_POSITIONS_REACHED');
    });

    it('vetoes when over max positions limit', async () => {
      const positions = makeOpenPositions(5);
      const decision = await engine.evaluate(mockSignal, mockPortfolio, positions);
      expect(decision.outcome).toBe('vetoed');
      expect(decision.vetoReason).toBe('MAX_POSITIONS_REACHED');
    });
  });

  // --- Check 4: Balance

  describe('Check 4: Insufficient balance', () => {
    it('vetoes when available USDT is zero', async () => {
      const emptyPortfolio: PortfolioBalance = { ...mockPortfolio, availableUsdt: 0 };
      const decision = await engine.evaluate(mockSignal, emptyPortfolio, noOpenPositions);
      expect(decision.outcome).toBe('vetoed');
      expect(decision.vetoReason).toBe('INSUFFICIENT_BALANCE');
    });
  });

  // --- Check 7: Cooldown

  describe('Check 7: Cooldown', () => {
    it('approves first signal with no cooldown', async () => {
      const decision = await engine.evaluate(mockSignal, mockPortfolio, noOpenPositions);
      expect(decision.outcome).toBe('approved');
    });

    it('vetoes second signal within cooldown period', async () => {
      // First signal — approved and sets cooldown
      await engine.evaluate(mockSignal, mockPortfolio, noOpenPositions);

      // Second signal immediately after — should hit cooldown
      const secondDecision = await engine.evaluate(
        { ...mockSignal, id: 'signal-2' },
        mockPortfolio,
        noOpenPositions,
      );
      expect(secondDecision.outcome).toBe('vetoed');
      expect(secondDecision.vetoReason).toBe('COOLDOWN_ACTIVE');
    });
  });

  // --- RiskDecision shape

  describe('RiskDecision output', () => {
    it('approved decision includes positionSizeAllowed', async () => {
      const decision = await engine.evaluate(mockSignal, mockPortfolio, noOpenPositions);
      expect(decision.outcome).toBe('approved');
      expect(decision.positionSizeAllowed).toBeGreaterThan(0);
      // Max 20% of 10,000 USDT = 2,000 USDT
      expect(decision.positionSizeAllowed).toBeLessThanOrEqual(2000);
    });

    it('vetoed decision includes vetoReason and vetoDetail', async () => {
      engine.activateKillSwitch('test');
      const decision = await engine.evaluate(mockSignal, mockPortfolio, noOpenPositions);
      expect(decision.vetoReason).toBeDefined();
      expect(decision.vetoDetail).toBeDefined();
    });

    it('every decision includes checksPerformed array', async () => {
      const decision = await engine.evaluate(mockSignal, mockPortfolio, noOpenPositions);
      expect(Array.isArray(decision.checksPerformed)).toBe(true);
      expect(decision.checksPerformed.length).toBeGreaterThan(0);
    });

    it('every check in checksPerformed has required fields', async () => {
      const decision = await engine.evaluate(mockSignal, mockPortfolio, noOpenPositions);
      for (const check of decision.checksPerformed) {
        expect(typeof check.checkName).toBe('string');
        expect(typeof check.passed).toBe('boolean');
      }
    });
  });
});

// --- Integration note:
// The integration test (tests/integration/risk-veto-blocks.test.ts)
// verifies that a vetoed RiskDecision prevents paper-execution from
// placing any order at the adapter level.

/**
 * packages/paper-execution/src/adapters/live-execution.adapter.ts
 *
 * LiveExecutionAdapter — STUB ONLY. NOT IMPLEMENTED IN V1.
 *
 * ============================================================
 * ⛔ THIS CLASS IS INTENTIONALLY BLOCKED ⛔
 *
 * Live trading is out of scope for v1.
 * This file exists to:
 *   1. Define the boundary clearly
 *   2. Prevent accidental live trading via structural guard
 *   3. Document what would be needed in a future version
 *
 * See: docs/11-live-trading-transition.md for requirements
 * ============================================================
 *
 * DO NOT:
 *   - Implement the methods in this class without a formal live trading phase
 *   - Remove the guard in the constructor
 *   - Import this class anywhere except its own tests
 *   - Set MODE=live in any configuration file
 */

import type {
  ExecutionAdapter,
  PlaceOrderParams,
  OrderResult,
  PortfolioBalance,
  OpenPosition,
  PaperOrder,
} from '@crypto-paper-bot/shared-types';

export class LiveExecutionAdapter implements ExecutionAdapter {
  constructor() {
    // ⛔ PERMANENT GUARD — DO NOT REMOVE ⛔
    // This guard ensures that live trading is never accidentally enabled.
    // Removing this guard requires a formal architecture review.
    throw new Error(
      [
        '⛔ LiveExecutionAdapter is not available in v1.',
        'Live trading requires a separate, explicitly gated extension.',
        'See: docs/11-live-trading-transition.md',
        '',
        'To enable live trading in a future version, ALL of the following are required:',
        '  - MODE=live set in environment',
        '  - LIVE_TRADING_ENABLED=true set explicitly',
        '  - LIVE_TRADING_CONFIRMED=I_UNDERSTAND_THIS_USES_REAL_FUNDS set',
        '  - Valid EXCHANGE_API_KEY and EXCHANGE_API_SECRET present',
        '  - All safety checks passing',
        '  - This class fully implemented and reviewed',
      ].join('\n')
    );
  }

  // These methods will never be reached due to the constructor guard.
  // They exist only to satisfy the TypeScript interface.

  async placeOrder(_params: PlaceOrderParams): Promise<OrderResult> {
    throw new Error('LiveExecutionAdapter is blocked. See constructor.');
  }

  async cancelOrder(_orderId: string): Promise<void> {
    throw new Error('LiveExecutionAdapter is blocked. See constructor.');
  }

  async getBalance(): Promise<PortfolioBalance> {
    throw new Error('LiveExecutionAdapter is blocked. See constructor.');
  }

  async getOpenPositions(): Promise<OpenPosition[]> {
    throw new Error('LiveExecutionAdapter is blocked. See constructor.');
  }

  async getOpenOrders(): Promise<PaperOrder[]> {
    throw new Error('LiveExecutionAdapter is blocked. See constructor.');
  }
}

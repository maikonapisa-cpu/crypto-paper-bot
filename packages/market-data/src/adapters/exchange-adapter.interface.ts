/**
 * packages/market-data/src/adapters/exchange-adapter.interface.ts
 *
 * ExchangeAdapter — the contract that all exchange integrations must fulfill.
 *
 * RULE: Only public, unauthenticated endpoints may be implemented here.
 *       Private endpoints, signed requests, and account data are forbidden.
 *
 * Phase 2: market-data-engineer implements BinancePublicAdapter
 */

import type {
  ExchangeAdapter,
  AdapterHealth,
  TickerSnapshot,
  Candle,
  OrderBookSnapshot,
  MarketTrade,
  SystemHealthEvent,
  CandleInterval,
} from '@crypto-paper-bot/shared-types';

export type { ExchangeAdapter };

/**
 * Base class providing common reconnect logic and health tracking.
 * Exchange-specific adapters extend this class.
 *
 * Phase 2: Implement this base class.
 */
export abstract class BaseExchangeAdapter implements ExchangeAdapter {
  protected _health: AdapterHealth = {
    connected: false,
    lastMessageAt: null,
    reconnectCount: 0,
    isStale: false,
    staleSince: null,
  };

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract subscribeTicker(symbol: string): void;
  abstract subscribeCandles(symbol: string, interval: CandleInterval): void;
  abstract subscribeOrderBook(symbol: string, depth?: number): void;
  abstract subscribeRecentTrades(symbol: string): void;
  abstract onTicker(cb: (t: TickerSnapshot) => void): void;
  abstract onCandle(cb: (c: Candle) => void): void;
  abstract onOrderBook(cb: (ob: OrderBookSnapshot) => void): void;
  abstract onTrade(cb: (t: MarketTrade) => void): void;
  abstract onHealthEvent(cb: (e: SystemHealthEvent) => void): void;

  getHealth(): AdapterHealth {
    return { ...this._health };
  }

  /** Called by subclass on every received message to track freshness */
  protected markMessageReceived(): void {
    this._health.lastMessageAt = new Date();
    this._health.isStale = false;
    this._health.staleSince = null;
  }

  /** Called by StaleDataDetector when no messages received within threshold */
  markStale(since: Date): void {
    this._health.isStale = true;
    this._health.staleSince = since;
  }
}

/**
 * BinancePublicAdapter — Phase 2 implementation target
 *
 * Connects to:
 *   WS:   wss://stream.binance.com:9443/ws
 *   REST: https://api.binance.com
 *
 * Authentication: NONE (public endpoints only)
 */
export class BinancePublicAdapter extends BaseExchangeAdapter {
  constructor(_config: { wsUrl: string; restUrl: string }) {
    super();
    // Phase 2: Initialize WS client, REST client
    // TODO: implement
  }

  async connect(): Promise<void> {
    throw new Error('BinancePublicAdapter.connect() — not yet implemented. Phase 2.');
  }

  async disconnect(): Promise<void> {
    throw new Error('BinancePublicAdapter.disconnect() — not yet implemented. Phase 2.');
  }

  subscribeTicker(_symbol: string): void {
    throw new Error('Not yet implemented. Phase 2.');
  }

  subscribeCandles(_symbol: string, _interval: CandleInterval): void {
    throw new Error('Not yet implemented. Phase 2.');
  }

  subscribeOrderBook(_symbol: string, _depth?: number): void {
    throw new Error('Not yet implemented. Phase 2.');
  }

  subscribeRecentTrades(_symbol: string): void {
    throw new Error('Not yet implemented. Phase 2.');
  }

  onTicker(_cb: (t: TickerSnapshot) => void): void {
    throw new Error('Not yet implemented. Phase 2.');
  }

  onCandle(_cb: (c: Candle) => void): void {
    throw new Error('Not yet implemented. Phase 2.');
  }

  onOrderBook(_cb: (ob: OrderBookSnapshot) => void): void {
    throw new Error('Not yet implemented. Phase 2.');
  }

  onTrade(_cb: (t: MarketTrade) => void): void {
    throw new Error('Not yet implemented. Phase 2.');
  }

  onHealthEvent(_cb: (e: SystemHealthEvent) => void): void {
    throw new Error('Not yet implemented. Phase 2.');
  }
}

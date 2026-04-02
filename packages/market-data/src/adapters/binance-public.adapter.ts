/**
 * packages/market-data/src/adapters/binance-public.adapter.ts
 *
 * Connects to Binance PUBLIC streams only. No API keys. No auth.
 * WebSocket primary, REST fallback for snapshots.
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';
import type {
  ExchangeAdapter,
  AdapterHealth,
  TickerSnapshot,
  Candle,
  CandleInterval,
  OrderBookSnapshot,
  MarketTrade,
  SystemHealthEvent,
} from '@crypto-paper-bot/shared-types';
import { normalizeTicker, normalizeKline, normalizeDepth, normalizeTrade } from '../normalizers';

const WS_BASE = 'wss://stream.binance.com:9443/ws';
const REST_BASE = 'https://api.binance.com';

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];

export class BinancePublicAdapter extends EventEmitter implements ExchangeAdapter {
  private ws: WebSocket | null = null;
  private subscriptions: string[] = [];
  private reconnectAttempt = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private isDisconnecting = false;

  private health: AdapterHealth = {
    connected: false,
    lastMessageAt: null,
    reconnectCount: 0,
    isStale: false,
    staleSince: null,
  };

  constructor(private readonly config: {
    wsUrl?: string;
    restUrl?: string;
    staleTresholdMs?: number;
  } = {}) {
    super();
    this.config.wsUrl = config.wsUrl ?? WS_BASE;
    this.config.restUrl = config.restUrl ?? REST_BASE;
    this.config.staleTresholdMs = config.staleTresholdMs ?? 10_000;
  }

  // ---- Subscribe methods (call before connect) --------------

  subscribeTicker(symbol: string): void {
    this.subscriptions.push(`${symbol.toLowerCase()}@ticker`);
  }

  subscribeCandles(symbol: string, interval: CandleInterval): void {
    this.subscriptions.push(`${symbol.toLowerCase()}@kline_${interval}`);
  }

  subscribeOrderBook(symbol: string, depth = 10): void {
    this.subscriptions.push(`${symbol.toLowerCase()}@depth${depth}@1000ms`);
  }

  subscribeRecentTrades(symbol: string): void {
    this.subscriptions.push(`${symbol.toLowerCase()}@trade`);
  }

  // ---- Event listener registration -------------------------

  onTicker(cb: (t: TickerSnapshot) => void): void { this.on('ticker', cb); }
  onCandle(cb: (c: Candle) => void): void { this.on('candle', cb); }
  onOrderBook(cb: (ob: OrderBookSnapshot) => void): void { this.on('orderbook', cb); }
  onTrade(cb: (t: MarketTrade) => void): void { this.on('trade', cb); }
  onHealthEvent(cb: (e: SystemHealthEvent) => void): void { this.on('health', cb); }

  getHealth(): AdapterHealth { return { ...this.health }; }

  // ---- Connection ------------------------------------------

  async connect(): Promise<void> {
    if (this.subscriptions.length === 0) {
      throw new Error('No subscriptions registered. Call subscribe*() before connect().');
    }

    const streams = this.subscriptions.join('/');
    const url = `${this.config.wsUrl}/stream?streams=${streams}`;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      const onOpen = () => {
        this.health.connected = true;
        this.health.reconnectCount = this.reconnectAttempt;
        this.reconnectAttempt = 0;
        this.startPing();
        this.emitHealth('info', 'CONNECTED', 'Connected to Binance public WebSocket');
        resolve();
      };

      const onError = (err: Error) => {
        if (!this.health.connected) reject(err);
        this.emitHealth('error', 'DISCONNECTED', `WebSocket error: ${err.message}`);
      };

      this.ws.once('open', onOpen);
      this.ws.on('error', onError);
      this.ws.on('message', (data) => this.handleMessage(data.toString()));
      this.ws.on('close', () => this.handleClose());
      this.ws.on('pong', () => { this.health.lastMessageAt = new Date(); });
    });
  }

  async disconnect(): Promise<void> {
    this.isDisconnecting = true;
    this.clearTimers();
    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
    }
    this.health.connected = false;
    this.emitHealth('info', 'DISCONNECTED', 'Disconnected (intentional)');
  }

  // ---- REST snapshot fallback ------------------------------

  async fetchTickerSnapshot(symbol: string): Promise<TickerSnapshot> {
    const url = `${this.config.restUrl}/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`REST ticker fetch failed: ${res.status}`);
    const raw = await res.json() as Record<string, string>;
    return normalizeTicker(raw, new Date());
  }

  async fetchCandles(symbol: string, interval: CandleInterval, limit = 100): Promise<Candle[]> {
    const url = `${this.config.restUrl}/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`REST klines fetch failed: ${res.status}`);
    const raw = await res.json() as unknown[][];
    const now = new Date();
    return raw.map((k) => normalizeKline(k as (string | number)[], symbol, interval, now));
  }

  async fetchOrderBook(symbol: string, limit = 20): Promise<OrderBookSnapshot> {
    const url = `${this.config.restUrl}/api/v3/depth?symbol=${symbol.toUpperCase()}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`REST depth fetch failed: ${res.status}`);
    const raw = await res.json() as { lastUpdateId: number; bids: string[][]; asks: string[][] };
    return normalizeDepth(raw, symbol, new Date());
  }

  // ---- Private: message handling ---------------------------

  private handleMessage(data: string): void {
    this.health.lastMessageAt = new Date();
    this.health.isStale = false;

    try {
      const msg = JSON.parse(data) as { stream: string; data: Record<string, unknown> };
      const { stream, data: payload } = msg;

      if (stream.endsWith('@ticker')) {
        const ticker = normalizeTicker(payload as Record<string, string>, new Date());
        this.emit('ticker', ticker);
      } else if (stream.includes('@kline_')) {
        const kline = payload['k'] as Record<string, unknown>;
        const symbol = (payload['s'] as string).toUpperCase();
        const interval = stream.split('@kline_')[1] as CandleInterval;
        const candle = normalizeKline(kline, symbol, interval, new Date());
        this.emit('candle', candle);
      } else if (stream.includes('@depth')) {
        const symbol = stream.split('@')[0].toUpperCase();
        const ob = normalizeDepth(
          payload as { lastUpdateId: number; bids: string[][]; asks: string[][] },
          symbol,
          new Date()
        );
        this.emit('orderbook', ob);
      } else if (stream.endsWith('@trade')) {
        const trade = normalizeTrade(payload as Record<string, unknown>, new Date());
        this.emit('trade', trade);
      }
    } catch (err) {
      // Malformed message — log but don't crash
      console.warn('[BinanceAdapter] Failed to parse message:', err);
    }
  }

  private handleClose(): void {
    this.health.connected = false;
    this.clearTimers();

    if (this.isDisconnecting) return;

    this.emitHealth('warning', 'RECONNECTING',
      `Connection lost. Reconnect attempt ${this.reconnectAttempt + 1}...`);

    const delay = RECONNECT_DELAYS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((err) => {
        this.emitHealth('error', 'DISCONNECTED', `Reconnect failed: ${String(err)}`);
      });
    }, delay);
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping();

        // Check staleness
        if (this.health.lastMessageAt) {
          const elapsed = Date.now() - this.health.lastMessageAt.getTime();
          if (elapsed > (this.config.staleTresholdMs ?? 10_000)) {
            if (!this.health.isStale) {
              this.health.isStale = true;
              this.health.staleSince = new Date();
              this.emitHealth('warning', 'STALE_DATA_DETECTED',
                `No market data for ${Math.round(elapsed / 1000)}s`);
            }
          }
        }
      }
    }, 5000);
  }

  private clearTimers(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.pingTimer = null;
    this.reconnectTimer = null;
  }

  private emitHealth(
    severity: SystemHealthEvent['severity'],
    eventType: SystemHealthEvent['eventType'],
    detail: string,
  ): void {
    const event: SystemHealthEvent = {
      id: uuid(),
      timestamp: new Date(),
      component: 'market-data',
      severity,
      eventType,
      detail,
    };
    this.emit('health', event);
    console.log(`[MarketData] [${severity.toUpperCase()}] ${detail}`);
  }
}

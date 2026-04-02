/**
 * packages/market-data/src/normalizers/index.ts
 *
 * Convert raw Binance API responses → internal schema types.
 * All normalizers are pure functions — easy to unit test.
 */

import { v4 as uuid } from 'uuid';
import type {
  TickerSnapshot,
  Candle,
  CandleInterval,
  OrderBookSnapshot,
  OrderBookLevel,
  MarketTrade,
} from '@crypto-paper-bot/shared-types';

const EXCHANGE = 'binance-public';

/** Convert exchange symbol "BTCUSDT" → internal "BTC/USDT" */
export function normalizeSymbol(raw: string): string {
  // Handle common quote assets
  const quotes = ['USDT', 'BTC', 'ETH', 'BNB', 'BUSD', 'USDC'];
  for (const q of quotes) {
    if (raw.endsWith(q)) {
      return `${raw.slice(0, raw.length - q.length)}/${q}`;
    }
  }
  return raw; // fallback: return as-is
}

// ---- Ticker -----------------------------------------------

/** Handles both WS stream format and REST format */
export function normalizeTicker(
  raw: Record<string, string | number>,
  receivedAt: Date,
): TickerSnapshot {
  // WS stream uses lowercase keys; REST uses mixed
  const sourceSymbol = String(raw['s'] ?? raw['symbol'] ?? '');
  const bidPrice = parseFloat(String(raw['b'] ?? raw['bidPrice'] ?? '0'));
  const askPrice = parseFloat(String(raw['a'] ?? raw['askPrice'] ?? '0'));

  return {
    id: uuid(),
    symbol: normalizeSymbol(sourceSymbol),
    sourceSymbol,
    exchange: EXCHANGE,
    timestamp: new Date(),
    receivedAt,
    bidPrice,
    askPrice,
    midPrice: (bidPrice + askPrice) / 2,
    lastPrice: parseFloat(String(raw['c'] ?? raw['lastPrice'] ?? '0')),
    volume24h: parseFloat(String(raw['v'] ?? raw['volume'] ?? '0')),
    priceChange24h: parseFloat(String(raw['p'] ?? raw['priceChange'] ?? '0')),
    priceChangePct24h: parseFloat(String(raw['P'] ?? raw['priceChangePercent'] ?? '0')),
    high24h: parseFloat(String(raw['h'] ?? raw['highPrice'] ?? '0')),
    low24h: parseFloat(String(raw['l'] ?? raw['lowPrice'] ?? '0')),
  };
}

// ---- Candle (kline) ---------------------------------------

/**
 * Handles both:
 *   - REST format: array [openTime, open, high, low, close, ...]
 *   - WS stream format: object with k.o, k.h, k.l, k.c, k.x etc.
 */
export function normalizeKline(
  raw: (string | number)[] | Record<string, unknown>,
  sourceSymbol: string,
  interval: CandleInterval,
  receivedAt: Date,
): Candle {
  let openTime: number, closeTime: number, open: number, high: number,
    low: number, close: number, volume: number, quoteVolume: number,
    tradeCount: number, isClosed: boolean;

  if (Array.isArray(raw)) {
    // REST format
    [openTime, , , , , , closeTime, quoteVolume, tradeCount] = raw as number[];
    open = parseFloat(raw[1] as string);
    high = parseFloat(raw[2] as string);
    low = parseFloat(raw[3] as string);
    close = parseFloat(raw[4] as string);
    volume = parseFloat(raw[5] as string);
    quoteVolume = parseFloat(raw[7] as string);
    tradeCount = Number(raw[8]);
    isClosed = true; // REST candles are always closed
  } else {
    // WS kline object format
    const k = raw as Record<string, unknown>;
    openTime = Number(k['t']);
    closeTime = Number(k['T']);
    open = parseFloat(String(k['o']));
    high = parseFloat(String(k['h']));
    low = parseFloat(String(k['l']));
    close = parseFloat(String(k['c']));
    volume = parseFloat(String(k['v']));
    quoteVolume = parseFloat(String(k['q']));
    tradeCount = Number(k['n']);
    isClosed = Boolean(k['x']);
    sourceSymbol = String(k['s'] ?? sourceSymbol);
  }

  return {
    id: uuid(),
    symbol: normalizeSymbol(sourceSymbol),
    exchange: EXCHANGE,
    openTime: new Date(openTime),
    closeTime: new Date(closeTime),
    interval,
    open,
    high,
    low,
    close,
    volume,
    quoteVolume,
    tradeCount,
    isClosed,
    receivedAt,
  };
}

// ---- Order book ------------------------------------------

export function normalizeDepth(
  raw: { lastUpdateId?: number; bids: string[][]; asks: string[][] },
  sourceSymbol: string,
  receivedAt: Date,
): OrderBookSnapshot {
  const parseLevels = (levels: string[][]): OrderBookLevel[] =>
    levels.map(([price, quantity]) => ({
      price: parseFloat(price),
      quantity: parseFloat(quantity),
    }));

  const bids = parseLevels(raw.bids).sort((a, b) => b.price - a.price);
  const asks = parseLevels(raw.asks).sort((a, b) => a.price - b.price);

  return {
    id: uuid(),
    symbol: normalizeSymbol(sourceSymbol),
    exchange: EXCHANGE,
    timestamp: receivedAt,
    receivedAt,
    bids,
    asks,
    depth: Math.max(bids.length, asks.length),
  };
}

// ---- Market trade ----------------------------------------

export function normalizeTrade(
  raw: Record<string, unknown>,
  receivedAt: Date,
): MarketTrade {
  const sourceSymbol = String(raw['s'] ?? '');
  return {
    id: uuid(),
    symbol: normalizeSymbol(sourceSymbol),
    exchange: EXCHANGE,
    timestamp: new Date(Number(raw['T'] ?? raw['time'] ?? Date.now())),
    receivedAt,
    price: parseFloat(String(raw['p'] ?? raw['price'] ?? '0')),
    quantity: parseFloat(String(raw['q'] ?? raw['qty'] ?? '0')),
    side: Boolean(raw['m'] ?? raw['isBuyerMaker']) ? 'sell' : 'buy',
    tradeId: String(raw['t'] ?? raw['id'] ?? ''),
  };
}

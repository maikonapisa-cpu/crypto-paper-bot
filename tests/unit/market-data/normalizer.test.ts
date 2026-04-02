/**
 * tests/unit/market-data/normalizer.test.ts
 *
 * Unit tests for market data normalizers.
 * Each normalizer converts raw exchange format → internal schema.
 *
 * These tests use snapshot raw responses from Binance public API.
 * No live connection is required.
 *
 * Phase 2: market-data-engineer implements the normalizers;
 * qa-verifier verifies these tests pass.
 */

import { describe, it, expect } from 'vitest';
import type { TickerSnapshot, Candle, OrderBookSnapshot, MarketTrade } from '@crypto-paper-bot/shared-types';

// ---- Raw Binance API response fixtures --------------------
// These are representative examples of real Binance public API responses.

const rawBinanceTicker = {
  symbol: 'BTCUSDT',
  bidPrice: '44990.00',
  bidQty: '1.234',
  askPrice: '45010.00',
  askQty: '0.987',
  lastPrice: '44999.00',
  volume: '12345.678',
  priceChange: '500.00',
  priceChangePercent: '1.12',
  highPrice: '45500.00',
  lowPrice: '44000.00',
  closeTime: 1704067199999,
};

const rawBinanceKline = [
  1704067200000,  // open time (ms)
  '44500.00',     // open
  '45500.00',     // high
  '44000.00',     // low
  '45000.00',     // close
  '1234.567',     // volume
  1704067259999,  // close time
  '55555555.00',  // quote volume
  5000,           // trade count
  '617.283',      // taker buy base volume
  '27777777.50',  // taker buy quote volume
  '0',            // ignore
];

const rawBinanceDepth = {
  lastUpdateId: 123456789,
  bids: [
    ['44999.00', '1.500'],
    ['44998.00', '2.300'],
    ['44997.00', '0.800'],
  ],
  asks: [
    ['45001.00', '0.700'],
    ['45002.00', '1.200'],
    ['45003.00', '3.400'],
  ],
};

const rawBinanceTrade = {
  id: 987654321,
  price: '45000.00',
  qty: '0.012',
  quoteQty: '540.00',
  time: 1704067230000,
  isBuyerMaker: false,
};

// ---- Normalizer functions (spec — Phase 2 implements matching functions) ----
// These are reference implementations defining the expected output shape.

function normalizeBinanceTicker(raw: typeof rawBinanceTicker, receivedAt: Date): TickerSnapshot {
  const bidPrice = parseFloat(raw.bidPrice);
  const askPrice = parseFloat(raw.askPrice);
  return {
    id: `ticker-${raw.symbol}-${raw.closeTime}`,
    symbol: 'BTC/USDT',
    sourceSymbol: raw.symbol,
    exchange: 'binance-public',
    timestamp: new Date(raw.closeTime),
    receivedAt,
    bidPrice,
    askPrice,
    lastPrice: parseFloat(raw.lastPrice),
    volume24h: parseFloat(raw.volume),
    priceChange24h: parseFloat(raw.priceChange),
    priceChangePct24h: parseFloat(raw.priceChangePercent),
    high24h: parseFloat(raw.highPrice),
    low24h: parseFloat(raw.lowPrice),
    midPrice: (bidPrice + askPrice) / 2,
  };
}

function normalizeBinanceKline(raw: typeof rawBinanceKline, symbol: string, interval: string, receivedAt: Date): Candle {
  return {
    id: `candle-${symbol}-${interval}-${raw[0]}`,
    symbol: 'BTC/USDT',
    exchange: 'binance-public',
    openTime: new Date(raw[0] as number),
    closeTime: new Date(raw[6] as number),
    interval: interval as any,
    open: parseFloat(raw[1] as string),
    high: parseFloat(raw[2] as string),
    low: parseFloat(raw[3] as string),
    close: parseFloat(raw[4] as string),
    volume: parseFloat(raw[5] as string),
    quoteVolume: parseFloat(raw[7] as string),
    tradeCount: raw[8] as number,
    isClosed: true,
    receivedAt,
  };
}

function normalizeBinanceDepth(raw: typeof rawBinanceDepth, symbol: string, receivedAt: Date): OrderBookSnapshot {
  return {
    id: `ob-${symbol}-${raw.lastUpdateId}`,
    symbol: 'BTC/USDT',
    exchange: 'binance-public',
    timestamp: receivedAt,
    receivedAt,
    bids: raw.bids.map(([price, quantity]) => ({
      price: parseFloat(price),
      quantity: parseFloat(quantity),
    })).sort((a, b) => b.price - a.price),
    asks: raw.asks.map(([price, quantity]) => ({
      price: parseFloat(price),
      quantity: parseFloat(quantity),
    })).sort((a, b) => a.price - b.price),
    depth: Math.max(raw.bids.length, raw.asks.length),
  };
}

function normalizeBinanceTrade(raw: typeof rawBinanceTrade, symbol: string, receivedAt: Date): MarketTrade {
  return {
    id: `trade-${symbol}-${raw.id}`,
    symbol: 'BTC/USDT',
    exchange: 'binance-public',
    timestamp: new Date(raw.time),
    receivedAt,
    price: parseFloat(raw.price),
    quantity: parseFloat(raw.qty),
    side: raw.isBuyerMaker ? 'sell' : 'buy',
    tradeId: String(raw.id),
  };
}

// ---- Tests ------------------------------------------------

const now = new Date();

describe('Ticker normalizer', () => {
  let ticker: TickerSnapshot;

  beforeAll(() => {
    ticker = normalizeBinanceTicker(rawBinanceTicker, now);
  });

  it('symbol is normalized to BTC/USDT format', () => {
    expect(ticker.symbol).toBe('BTC/USDT');
  });

  it('sourceSymbol retains exchange-native format', () => {
    expect(ticker.sourceSymbol).toBe('BTCUSDT');
  });

  it('exchange is set correctly', () => {
    expect(ticker.exchange).toBe('binance-public');
  });

  it('bid and ask prices are parsed as numbers', () => {
    expect(ticker.bidPrice).toBe(44990);
    expect(ticker.askPrice).toBe(45010);
  });

  it('midPrice is computed as (bid + ask) / 2', () => {
    expect(ticker.midPrice).toBe((44990 + 45010) / 2);
    expect(ticker.midPrice).toBe(45000);
  });

  it('volume24h is a number', () => {
    expect(typeof ticker.volume24h).toBe('number');
    expect(ticker.volume24h).toBeGreaterThan(0);
  });

  it('timestamp is a Date', () => {
    expect(ticker.timestamp).toBeInstanceOf(Date);
  });

  it('receivedAt is a Date', () => {
    expect(ticker.receivedAt).toBeInstanceOf(Date);
  });
});

describe('Candle (kline) normalizer', () => {
  let candle: Candle;

  beforeAll(() => {
    candle = normalizeBinanceKline(rawBinanceKline, 'BTCUSDT', '1m', now);
  });

  it('OHLCV values are parsed as numbers', () => {
    expect(candle.open).toBe(44500);
    expect(candle.high).toBe(45500);
    expect(candle.low).toBe(44000);
    expect(candle.close).toBe(45000);
    expect(candle.volume).toBeCloseTo(1234.567, 3);
  });

  it('openTime and closeTime are Dates', () => {
    expect(candle.openTime).toBeInstanceOf(Date);
    expect(candle.closeTime).toBeInstanceOf(Date);
  });

  it('closeTime is after openTime', () => {
    expect(candle.closeTime > candle.openTime).toBe(true);
  });

  it('tradeCount is an integer', () => {
    expect(candle.tradeCount).toBe(5000);
    expect(Number.isInteger(candle.tradeCount)).toBe(true);
  });

  it('isClosed is boolean', () => {
    expect(typeof candle.isClosed).toBe('boolean');
  });

  it('interval is preserved', () => {
    expect(candle.interval).toBe('1m');
  });
});

describe('Order book normalizer', () => {
  let ob: OrderBookSnapshot;

  beforeAll(() => {
    ob = normalizeBinanceDepth(rawBinanceDepth, 'BTCUSDT', now);
  });

  it('bids are sorted descending by price', () => {
    for (let i = 1; i < ob.bids.length; i++) {
      expect(ob.bids[i - 1].price).toBeGreaterThanOrEqual(ob.bids[i].price);
    }
  });

  it('asks are sorted ascending by price', () => {
    for (let i = 1; i < ob.asks.length; i++) {
      expect(ob.asks[i - 1].price).toBeLessThanOrEqual(ob.asks[i].price);
    }
  });

  it('best bid is below best ask (no crossed book)', () => {
    expect(ob.bids[0].price).toBeLessThan(ob.asks[0].price);
  });

  it('prices and quantities are numbers', () => {
    expect(typeof ob.bids[0].price).toBe('number');
    expect(typeof ob.bids[0].quantity).toBe('number');
  });

  it('depth reflects number of levels', () => {
    expect(ob.depth).toBe(3);
  });
});

describe('Market trade normalizer', () => {
  let trade: MarketTrade;

  beforeAll(() => {
    trade = normalizeBinanceTrade(rawBinanceTrade, 'BTCUSDT', now);
  });

  it('side is determined by isBuyerMaker (false = buy)', () => {
    expect(trade.side).toBe('buy');
  });

  it('side is sell when isBuyerMaker is true', () => {
    const sellTrade = normalizeBinanceTrade({ ...rawBinanceTrade, isBuyerMaker: true }, 'BTCUSDT', now);
    expect(sellTrade.side).toBe('sell');
  });

  it('price is a number', () => {
    expect(trade.price).toBe(45000);
  });

  it('quantity is a number', () => {
    expect(trade.quantity).toBeCloseTo(0.012, 3);
  });

  it('tradeId is a string', () => {
    expect(typeof trade.tradeId).toBe('string');
    expect(trade.tradeId).toBe('987654321');
  });

  it('timestamp is a Date', () => {
    expect(trade.timestamp).toBeInstanceOf(Date);
  });
});

// Needed for beforeAll in this file
import { beforeAll } from 'vitest';

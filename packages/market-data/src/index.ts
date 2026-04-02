/**
 * packages/market-data/src/index.ts
 *
 * Market Data Package — Public API
 *
 * This package handles all market data ingestion from public exchange endpoints.
 * It does NOT interact with private endpoints, authenticated streams, or execution APIs.
 *
 * Owned by: market-data-engineer
 * Phase: 2 (implementation pending)
 */

export { BinancePublicAdapter } from './adapters/binance-public.adapter';
export * from './normalizers';

// ---- IMPLEMENTATION STATUS --------------------------------
// Phase 1: This file is a scaffold stub.
// Phase 2: market-data-engineer implements:
//   - BinancePublicAdapter (WS + REST fallback)
//   - Normalizers for ticker, candles, orderbook, trades
//   - FeedDistributor (EventEmitter fan-out)
//   - StaleDataDetector
// -----------------------------------------------------------

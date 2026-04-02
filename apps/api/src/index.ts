/**
 * apps/api/src/index.ts
 *
 * ⚠️  PAPER TRADING ONLY — NOT CONNECTED TO LIVE FUNDS ⚠️
 *
 * Start with: pnpm dev  (from repo root or apps/api/)
 */
import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { loadConfig } from './config';
import { TradingEngine } from './services/trading-engine';
import { createRoutes } from './routes/index';
import { createWsServer } from './ws/ws-server';

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  ⚠️  PAPER TRADING ONLY — NOT CONNECTED TO LIVE FUNDS ⚠️  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  // Validate config — throws if MODE !== paper
  const config = loadConfig();
  console.log(`[Server] Mode: ${config.mode.toUpperCase()} | Pair: ${config.strategyDefaultPair} | Wallet: ${config.paperWalletInitialUsdt} USDT`);

  // Build Express app
  const app = express();
  app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000' }));
  app.use(express.json());

  // Health check (no engine required)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', mode: 'paper', timestamp: new Date() });
  });

  // Create engine
  const engine = new TradingEngine(config);

  // Mount REST routes
  app.use('/api', createRoutes(engine));

  // Create HTTP server + WebSocket server
  const httpServer = http.createServer(app);
  createWsServer(httpServer, engine);

  const port = Number(process.env['API_PORT'] ?? 3001);

  // Start HTTP server first, then engine
  await new Promise<void>(resolve => httpServer.listen(port, resolve));
  console.log(`[Server] API running on http://localhost:${port}`);
  console.log(`[Server] WebSocket on  ws://localhost:${port}/ws`);
  console.log(`[Server] Status:       http://localhost:${port}/api/status`);
  console.log(`[Server] Portfolio:    http://localhost:${port}/api/portfolio`);

  // Start trading engine (connects to market data, begins strategy loop)
  await engine.start();
  console.log('[Server] ✅ Engine running. Watching for signals...');
  console.log('');

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n[Server] Shutting down...');
    await engine.stop();
    httpServer.close(() => {
      console.log('[Server] Stopped.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(err => {
  console.error('[Server] Fatal error:', err);
  process.exit(1);
});

/**
 * apps/api/src/routes/index.ts
 * All REST endpoints for the dashboard.
 */
import { Router, Request, Response } from 'express';
import type { TradingEngine } from '../services/trading-engine';

export function createRoutes(engine: TradingEngine): Router {
  const router = Router();

  // ---- Market Data -----------------------------------------
  router.get('/market-data/ticker', (_req: Request, res: Response) => {
    const ticker = engine.getLatestTicker();
    if (!ticker) return res.status(503).json({ error: 'No ticker data yet' });
    res.json(ticker);
  });

  router.get('/market-data/candles', (_req: Request, res: Response) => {
    res.json(engine.getLatestCandles());
  });

  // ---- Portfolio -------------------------------------------
  router.get('/portfolio', async (_req: Request, res: Response) => {
    try {
      res.json(await engine.getPortfolio());
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // ---- Positions -------------------------------------------
  router.get('/positions', async (_req: Request, res: Response) => {
    res.json(await engine.getPositions());
  });

  // ---- Orders ----------------------------------------------
  router.get('/orders', async (_req: Request, res: Response) => {
    res.json(await engine.getOrders());
  });

  // ---- Journal ---------------------------------------------
  router.get('/journal', (_req: Request, res: Response) => {
    res.json(engine.getJournal());
  });

  router.get('/journal/summary', (_req: Request, res: Response) => {
    res.json(engine.getJournalSummary());
  });

  // ---- Analytics -------------------------------------------
  router.get('/analytics', async (_req: Request, res: Response) => {
    try {
      res.json(await engine.getMetrics());
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // ---- System Status ---------------------------------------
  router.get('/status', (_req: Request, res: Response) => {
    res.json({
      mode: 'PAPER',
      disclaimer: 'PAPER TRADING ONLY — NOT CONNECTED TO LIVE FUNDS',
      adapterHealth: engine.getAdapterHealth(),
      riskStatus: engine.getRiskStatus(),
      strategyConfig: engine.getStrategyConfig(),
      timestamp: new Date(),
    });
  });

  // ---- Risk Controls ---------------------------------------
  router.post('/risk/kill-switch', (req: Request, res: Response) => {
    const { active, reason } = req.body as { active: boolean; reason?: string };
    if (active) {
      engine.activateKillSwitch(reason ?? 'API request');
      res.json({ killSwitch: true, reason });
    } else {
      engine.deactivateKillSwitch();
      res.json({ killSwitch: false });
    }
  });

  return router;
}

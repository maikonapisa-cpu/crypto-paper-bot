/**
 * apps/api/src/ws/ws-server.ts
 * Broadcasts live engine events to all connected dashboard clients.
 */
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Server } from 'http';
import type { TradingEngine } from '../services/trading-engine';
import type { WsEvent } from '@crypto-paper-bot/shared-types';

export function createWsServer(httpServer: Server, engine: TradingEngine): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();

  const broadcast = (type: WsEvent['type'], payload: unknown) => {
    const msg = JSON.stringify({ type, timestamp: new Date(), payload });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) client.send(msg);
    }
  };

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    clients.add(ws);
    console.log(`[WS] Client connected. Total: ${clients.size}`);

    // Send current state immediately on connect
    const sendInitial = async () => {
      try {
        const [portfolio, positions, orders] = await Promise.all([
          engine.getPortfolio(),
          engine.getPositions(),
          engine.getOrders(),
        ]);
        ws.send(JSON.stringify({ type: 'portfolio_update', timestamp: new Date(), payload: portfolio }));
        ws.send(JSON.stringify({ type: 'position_update', timestamp: new Date(), payload: positions }));
        ws.send(JSON.stringify({ type: 'order_update', timestamp: new Date(), payload: orders }));

        const ticker = engine.getLatestTicker();
        if (ticker) ws.send(JSON.stringify({ type: 'ticker', timestamp: new Date(), payload: ticker }));

        const candles = engine.getLatestCandles();
        if (candles.length > 0) ws.send(JSON.stringify({ type: 'candle', timestamp: new Date(), payload: candles }));
      } catch (err) {
        console.error('[WS] Failed to send initial state:', err);
      }
    };
    void sendInitial();

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString()) as { action: string; payload?: unknown };
        if (msg.action === 'kill_switch_on') engine.activateKillSwitch('User request via dashboard');
        if (msg.action === 'kill_switch_off') engine.deactivateKillSwitch();
      } catch { /* ignore bad messages */ }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WS] Client disconnected. Total: ${clients.size}`);
    });
  });

  // Wire engine events to broadcast
  engine.on('ticker', payload => broadcast('ticker', payload));
  engine.on('candle', payload => broadcast('candle', payload));
  engine.on('orderbook', payload => broadcast('orderbook', payload));
  engine.on('trade', payload => broadcast('trade', payload));
  engine.on('signal', payload => broadcast('signal', payload));
  engine.on('risk_decision', payload => broadcast('risk_decision', payload));
  engine.on('portfolio', payload => broadcast('portfolio_update', payload));
  engine.on('positions_updated', payload => broadcast('position_update', payload));
  engine.on('order', payload => broadcast('order_update', payload));
  engine.on('journal_entry', payload => broadcast('analytics_update', payload));
  engine.on('health', payload => broadcast('health_event', payload));
  engine.on('metrics', payload => broadcast('analytics_update', payload));

  return wss;
}

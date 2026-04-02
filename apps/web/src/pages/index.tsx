/**
 * apps/web/src/pages/index.tsx
 *
 * ⚠️  PAPER TRADING ONLY — NOT CONNECTED TO LIVE FUNDS
 *
 * Main dashboard. All data comes from the API — never directly from exchanges.
 */
import { useEffect } from 'react';
import Head from 'next/head';
import { Header } from '../components/Header';
import { Chart } from '../components/Chart';
import { OrderBook } from '../components/OrderBook';
import {
  Portfolio, OpenPositions, SignalPanel, RecentTrades,
} from '../components/Portfolio';
import {
  TradeHistory, Performance, SystemHealth,
} from '../components/TradeHistory';
import { useWebSocket } from '../hooks/useWebSocket';
import { useDashboard } from '../stores/dashboard.store';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function Dashboard() {
  useWebSocket(); // establishes WS connection and feeds store

  // Load initial REST data on mount
  useEffect(() => {
    const { onWsMessage } = useDashboard.getState();

    const load = async () => {
      try {
        const [portfolio, positions, orders, journal, candles, status] = await Promise.all([
          fetch(`${API}/api/portfolio`).then(r => r.json()),
          fetch(`${API}/api/positions`).then(r => r.json()),
          fetch(`${API}/api/orders`).then(r => r.json()),
          fetch(`${API}/api/journal`).then(r => r.json()),
          fetch(`${API}/api/market-data/candles`).then(r => r.json()),
          fetch(`${API}/api/status`).then(r => r.json()),
        ]);
        onWsMessage('portfolio_update', portfolio);
        onWsMessage('position_update', positions);
        onWsMessage('order_update', orders);
        if (Array.isArray(journal)) journal.forEach((e: unknown) => onWsMessage('journal_entry', e));
        if (Array.isArray(candles)) onWsMessage('candle', candles);
        if (status?.riskStatus) onWsMessage('risk_status', status.riskStatus);
        if (status?.adapterHealth) onWsMessage('health_event', { ...status, timestamp: new Date() });
      } catch (err) {
        console.warn('API not available yet:', err);
      }
    };

    void load();
  }, []);

  return (
    <>
      <Head>
        <title>CryptoPaperBot — Paper Trading Dashboard</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Header />

        {/* Main grid */}
        <main className="flex-1 p-2 grid gap-2" style={{
          gridTemplateColumns: '1fr 220px',
          gridTemplateRows: 'auto',
        }}>

          {/* Left column */}
          <div className="flex flex-col gap-2 min-w-0">

            {/* Top row: Chart + Signal + Health */}
            <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 220px 220px' }}>
              <div style={{ height: 320 }}>
                <Chart />
              </div>
              <SignalPanel />
              <SystemHealth />
            </div>

            {/* Middle row: Portfolio + Positions */}
            <div className="grid grid-cols-2 gap-2">
              <Portfolio />
              <OpenPositions />
            </div>

            {/* Bottom: Performance */}
            <Performance />

            {/* Trade Journal — full width */}
            <TradeHistory />
          </div>

          {/* Right column: Order Book + Recent Trades */}
          <div className="flex flex-col gap-2">
            <div className="flex-1" style={{ minHeight: 400 }}>
              <OrderBook />
            </div>
            <div style={{ height: 300 }}>
              <RecentTrades />
            </div>
          </div>
        </main>

        {/* Footer disclaimer */}
        <footer className="border-t border-zinc-800 px-4 py-2 text-[10px] text-zinc-700 flex items-center justify-between">
          <span>CryptoPaperBot — Research and simulation only</span>
          <span>Paper trading results do not guarantee live trading performance. Simulated fills use estimated fees and slippage.</span>
        </footer>
      </div>
    </>
  );
}

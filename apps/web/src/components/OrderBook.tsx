/**
 * apps/web/src/components/OrderBook.tsx
 */
import { useMemo } from 'react';
import { useDashboard } from '../stores/dashboard.store';
import { Panel, EmptyState } from './ui';

export function OrderBook() {
  const { orderBook, ticker } = useDashboard();

  const { asks, bids, maxQty } = useMemo(() => {
    if (!orderBook) return { asks: [], bids: [], maxQty: 1 };
    const top = 12;
    const asks = orderBook.asks.slice(0, top);
    const bids = orderBook.bids.slice(0, top);
    const allQtys = [...asks, ...bids].map(l => l.quantity);
    return { asks: [...asks].reverse(), bids, maxQty: Math.max(...allQtys, 1) };
  }, [orderBook]);

  const spread = useMemo(() => {
    if (!orderBook?.asks[0] || !orderBook?.bids[0]) return null;
    const s = orderBook.asks[0].price - orderBook.bids[0].price;
    const pct = (s / orderBook.asks[0].price) * 100;
    return { abs: s, pct };
  }, [orderBook]);

  if (!orderBook) return <Panel title="Order Book"><EmptyState msg="Waiting for data..." /></Panel>;

  const fmtPrice = (p: number) => p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtQty = (q: number) => q.toFixed(4);

  return (
    <Panel title="Order Book" className="h-full">
      <div className="text-xs font-mono">
        {/* Column headers */}
        <div className="grid grid-cols-2 px-2 py-1 text-zinc-600 text-[10px] border-b border-zinc-800">
          <span>Price (USDT)</span>
          <span className="text-right">Quantity</span>
        </div>

        {/* Asks (sell side) — shown in reverse, red */}
        {asks.map((level, i) => {
          const pct = (level.quantity / maxQty) * 100;
          return (
            <div key={i} className="relative grid grid-cols-2 px-2 py-0.5 hover:bg-zinc-800/40">
              <div className="absolute inset-y-0 right-0 bg-rose-500/8 rounded-l-sm" style={{ width: `${pct}%` }} />
              <span className="text-rose-400 z-10">{fmtPrice(level.price)}</span>
              <span className="text-right text-zinc-400 z-10">{fmtQty(level.quantity)}</span>
            </div>
          );
        })}

        {/* Spread */}
        <div className="grid grid-cols-2 px-2 py-1 border-y border-zinc-800 bg-zinc-900/60">
          <span className="text-zinc-500 text-[10px]">Spread</span>
          <span className="text-right text-zinc-400 text-[10px]">
            {spread ? `$${spread.abs.toFixed(2)} (${spread.pct.toFixed(3)}%)` : '—'}
          </span>
        </div>

        {/* Mid price */}
        {ticker && (
          <div className="px-2 py-1.5 text-center font-semibold text-zinc-100 text-sm border-b border-zinc-800">
            ${fmtPrice(ticker.midPrice)}
          </div>
        )}

        {/* Bids (buy side) — green */}
        {bids.map((level, i) => {
          const pct = (level.quantity / maxQty) * 100;
          return (
            <div key={i} className="relative grid grid-cols-2 px-2 py-0.5 hover:bg-zinc-800/40">
              <div className="absolute inset-y-0 right-0 bg-emerald-500/8 rounded-l-sm" style={{ width: `${pct}%` }} />
              <span className="text-emerald-400 z-10">{fmtPrice(level.price)}</span>
              <span className="text-right text-zinc-400 z-10">{fmtQty(level.quantity)}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

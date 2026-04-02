/**
 * apps/web/src/components/Chart.tsx
 * Candlestick-style line chart using Recharts.
 */
import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useDashboard } from '../stores/dashboard.store';
import { Panel, EmptyState } from './ui';

function fmt(ts: string) {
  try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded p-2 text-xs font-mono shadow-xl">
      <div className="text-zinc-400 mb-1">{fmt(d.openTime)}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <span className="text-zinc-500">O</span><span>${d.open?.toLocaleString()}</span>
        <span className="text-zinc-500">H</span><span className="text-emerald-400">${d.high?.toLocaleString()}</span>
        <span className="text-zinc-500">L</span><span className="text-rose-400">${d.low?.toLocaleString()}</span>
        <span className="text-zinc-500">C</span><span className="text-zinc-100 font-semibold">${d.close?.toLocaleString()}</span>
        <span className="text-zinc-500">Vol</span><span>{d.volume?.toFixed(2)}</span>
      </div>
    </div>
  );
};

export function Chart() {
  const { candles, positions, ticker } = useDashboard();

  const data = useMemo(() =>
    candles.filter(c => c.isClosed).slice(-80).map(c => ({
      openTime: c.openTime,
      open: c.open, high: c.high, low: c.low, close: c.close,
      volume: c.volume,
      midline: (c.high + c.low) / 2,
    })),
    [candles]
  );

  const entryPrices = positions.filter(p => (p as any).status !== 'closed').map(p => p.entryPrice);

  const [yMin, yMax] = useMemo(() => {
    if (data.length === 0) return [0, 0];
    const lows = data.map(d => d.low);
    const highs = data.map(d => d.high);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const pad = (max - min) * 0.08;
    return [min - pad, max + pad];
  }, [data]);

  const isUp = data.length >= 2
    ? (data[data.length - 1]?.close ?? 0) >= (data[0]?.close ?? 0)
    : true;
  const strokeColor = isUp ? '#10b981' : '#f43f5e';
  const gradientId = isUp ? 'chartGradUp' : 'chartGradDown';

  return (
    <Panel title={`Price Chart — ${candles[0]?.symbol ?? '—'} (1m)`} className="h-full">
      {data.length === 0 ? (
        <EmptyState msg="Waiting for candle data..." />
      ) : (
        <div className="h-full p-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="chartGradUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="chartGradDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis dataKey="openTime" tickFormatter={fmt}
                tick={{ fill: '#52525b', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis domain={[yMin, yMax]}
                tick={{ fill: '#52525b', fontSize: 10 }} tickLine={false} axisLine={false}
                tickFormatter={v => `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                width={70} orientation="right" />
              <Tooltip content={<CustomTooltip />} />

              {/* Entry price reference lines */}
              {entryPrices.map((price, i) => (
                <ReferenceLine key={i} y={price} stroke="#f59e0b" strokeDasharray="4 4"
                  label={{ value: `Entry ${price.toFixed(0)}`, fill: '#f59e0b', fontSize: 9, position: 'insideLeft' }} />
              ))}

              {/* Current price line */}
              {ticker && (
                <ReferenceLine y={ticker.lastPrice} stroke="#71717a" strokeDasharray="2 4" />
              )}

              <Area dataKey="close" stroke={strokeColor} strokeWidth={1.5}
                fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 3, fill: strokeColor }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

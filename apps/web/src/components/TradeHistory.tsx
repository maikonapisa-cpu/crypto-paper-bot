/**
 * apps/web/src/components/TradeHistory.tsx
 */
import { useDashboard } from '../stores/dashboard.store';
import { Panel, PnlText, EmptyState } from './ui';

function duration(ms?: number) {
  if (!ms) return '—';
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

export function TradeHistory() {
  const { journal } = useDashboard();
  const closed = journal.filter(e => e.outcome && e.outcome !== 'open');

  return (
    <Panel title={`Trade Journal (${closed.length} closed)`}>
      {closed.length === 0 ? (
        <EmptyState msg="No closed trades yet. Waiting for first take-profit or close signal." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-[10px] text-zinc-600 border-b border-zinc-800">
                {['Symbol','Side','Entry','Exit','Qty','Net PnL','PnL%','Fees','Reason','Duration','Time'].map(h => (
                  <th key={h} className="px-2 py-1.5 text-left font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {closed.slice(0, 100).map(entry => (
                <tr key={entry.id} className="hover:bg-zinc-800/30">
                  <td className="px-2 py-1.5 text-zinc-200">{entry.symbol}</td>
                  <td className="px-2 py-1.5">
                    <span className="text-emerald-400">{entry.side.toUpperCase()}</span>
                  </td>
                  <td className="px-2 py-1.5">${entry.entryPrice.toFixed(2)}</td>
                  <td className="px-2 py-1.5">{entry.exitPrice ? `$${entry.exitPrice.toFixed(2)}` : '—'}</td>
                  <td className="px-2 py-1.5">{entry.quantity.toFixed(5)}</td>
                  <td className="px-2 py-1.5"><PnlText value={entry.netPnlUsdt} suffix=" USDT" /></td>
                  <td className="px-2 py-1.5"><PnlText value={entry.netPnlPct} /></td>
                  <td className="px-2 py-1.5 text-zinc-500">{entry.totalFeesUsdt.toFixed(4)}</td>
                  <td className="px-2 py-1.5">
                    <span className="text-sky-400 text-[10px]">{entry.exitSignalReasonCode ?? '—'}</span>
                  </td>
                  <td className="px-2 py-1.5 text-zinc-500">{duration(entry.durationMs)}</td>
                  <td className="px-2 py-1.5 text-zinc-600">
                    {entry.closedAt ? new Date(entry.closedAt).toLocaleTimeString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/**
 * apps/web/src/components/Performance.tsx
 */
export function Performance() {
  const { metrics, journal } = useDashboard();
  const summary = {
    total: journal.filter(e => e.outcome !== 'open').length,
    wins:  journal.filter(e => e.outcome === 'win').length,
    losses: journal.filter(e => e.outcome === 'loss').length,
  };

  const stat = (label: string, value: React.ReactNode) => (
    <div className="bg-zinc-950 rounded p-2 flex flex-col gap-0.5">
      <span className="text-[10px] text-zinc-600 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-mono font-semibold text-zinc-100">{value}</span>
    </div>
  );

  return (
    <Panel title="Performance">
      <div className="p-2 grid grid-cols-4 gap-2 text-xs">
        {stat('Trades', summary.total)}
        {stat('Win Rate', metrics ? `${(metrics.winRate * 100).toFixed(1)}%` : `${summary.total > 0 ? ((summary.wins/summary.total)*100).toFixed(0) : 0}%`)}
        {stat('Avg Return', metrics ? <PnlText value={metrics.averageReturnPct} /> : '—')}
        {stat('Max Drawdown', metrics ? <span className="text-rose-400">{metrics.maxDrawdownPct.toFixed(2)}%</span> : '—')}
        {stat('Total PnL', metrics ? <PnlText value={metrics.totalNetPnlUsdt} suffix=" USDT" /> : '—')}
        {stat('Profit Factor', metrics ? metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2) : '—')}
        {stat('TP Hit Rate', metrics ? `${(metrics.takeProfitHitRate * 100).toFixed(1)}%` : '—')}
        {stat('Total Fees', metrics ? `$${metrics.totalFeesUsdt.toFixed(4)}` : '—')}
      </div>
    </Panel>
  );
}

/**
 * apps/web/src/components/SystemHealth.tsx
 */
export function SystemHealth() {
  const { healthEvents, adapterHealth, wsConnected } = useDashboard();

  return (
    <Panel title="System Health">
      <div className="px-3 py-2 space-y-1 text-xs border-b border-zinc-800">
        <div className="flex justify-between">
          <span className="text-zinc-500">Dashboard</span>
          <span className={wsConnected ? 'text-emerald-400' : 'text-rose-400'}>
            {wsConnected ? '● Connected' : '● Reconnecting'}
          </span>
        </div>
        {adapterHealth && (
          <>
            <div className="flex justify-between">
              <span className="text-zinc-500">Market Data</span>
              <span className={adapterHealth.connected ? 'text-emerald-400' : 'text-rose-400'}>
                {adapterHealth.connected ? '● Live' : '● Disconnected'}
              </span>
            </div>
            {adapterHealth.isStale && (
              <div className="text-amber-400 text-[10px]">⚠ Data stale — new orders blocked</div>
            )}
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-600">Reconnects</span>
              <span className="text-zinc-500">{adapterHealth.reconnectCount}</span>
            </div>
          </>
        )}
      </div>
      <div className="overflow-auto max-h-32">
        {healthEvents.length === 0 ? (
          <div className="px-3 py-2 text-[10px] text-zinc-600">No events</div>
        ) : healthEvents.slice(0, 8).map((ev, i) => (
          <div key={i} className="px-3 py-1 text-[10px] font-mono border-b border-zinc-800/50 flex gap-2">
            <span className={
              ev.severity === 'error' || ev.severity === 'critical' ? 'text-rose-400' :
              ev.severity === 'warning' ? 'text-amber-400' : 'text-zinc-500'
            }>{ev.severity.toUpperCase()[0]}</span>
            <span className="text-zinc-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
            <span className="text-zinc-400 truncate">{ev.detail}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

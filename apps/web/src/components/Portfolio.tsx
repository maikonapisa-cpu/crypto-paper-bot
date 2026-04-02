/**
 * apps/web/src/components/Portfolio.tsx
 */
import { useDashboard } from '../stores/dashboard.store';
import { Panel, Row, PnlText, EmptyState } from './ui';

export function Portfolio() {
  const { portfolio } = useDashboard();
  if (!portfolio) return <Panel title="Portfolio"><EmptyState msg="Loading..." /></Panel>;

  return (
    <Panel title="Paper Wallet">
      <Row label="Total Equity"
        value={`$${portfolio.totalEquityUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        valueClass="text-zinc-100 font-semibold" />
      <Row label="Available USDT"
        value={`$${portfolio.availableUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
      <Row label="Unrealized PnL"
        value={<PnlText value={portfolio.unrealizedPnl} suffix=" USDT" />} />
      <Row label="Session PnL"
        value={<PnlText value={portfolio.realizedPnlSession} suffix=" USDT" />} />
      <Row label="All-Time PnL"
        value={<PnlText value={portfolio.realizedPnlAllTime} suffix=" USDT" />} />
      <Row label="Return"
        value={<PnlText value={portfolio.returnPct} suffix="%" />} />
      <Row label="Start Balance"
        value={`$${portfolio.initialBalance.toLocaleString()}`}
        valueClass="text-zinc-500" />
    </Panel>
  );
}

/**
 * apps/web/src/components/OpenPositions.tsx
 */
export function OpenPositions() {
  const { positions } = useDashboard();
  const open = positions.filter((p: any) => p.status !== 'closed');

  return (
    <Panel title={`Open Positions (${open.length})`}>
      {open.length === 0 ? (
        <EmptyState msg="No open positions" />
      ) : (
        <div className="divide-y divide-zinc-800">
          {open.map(pos => (
            <div key={pos.id} className="px-3 py-2 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-zinc-100">{pos.symbol}</span>
                <span className="text-emerald-400 text-[10px] bg-emerald-950/50 px-1.5 py-0.5 rounded">
                  {pos.side.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-0.5 font-mono text-[11px]">
                <span className="text-zinc-500">Entry</span>
                <span className="text-right">${pos.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-zinc-500">Current</span>
                <span className="text-right">${pos.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-zinc-500">Qty</span>
                <span className="text-right">{pos.quantity.toFixed(5)}</span>
                <span className="text-zinc-500">PnL</span>
                <span className="text-right"><PnlText value={pos.unrealizedPnl} suffix=" USDT" /></span>
                <span className="text-zinc-500">PnL%</span>
                <span className="text-right"><PnlText value={pos.unrealizedPnlPct} /></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/**
 * apps/web/src/components/SignalPanel.tsx
 */
export function SignalPanel() {
  const { latestSignal, riskStatus } = useDashboard();

  return (
    <Panel title="Strategy Signal">
      {!latestSignal ? (
        <EmptyState msg="No signal yet — watching market..." />
      ) : (
        <div className="px-3 py-2 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className={`font-bold text-sm px-2 py-0.5 rounded ${
              latestSignal.action === 'buy' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : latestSignal.action === 'sell' || latestSignal.action === 'close' ? 'bg-rose-950 text-rose-400 border border-rose-800'
              : 'bg-zinc-800 text-zinc-400'
            }`}>
              {latestSignal.action.toUpperCase()}
            </span>
            <span className="text-zinc-500 font-mono text-[10px]">
              {new Date(latestSignal.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <Row label="Symbol" value={latestSignal.symbol} />
          <Row label="Reason" value={latestSignal.reasonCode} valueClass="text-sky-400" />
          <Row label="Price" value={`$${latestSignal.referencePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
          <Row label="Confidence" value={`${(latestSignal.confidence * 100).toFixed(0)}%`} />
          <div className="mt-1.5 px-0 text-[10px] text-zinc-600 leading-relaxed">
            {latestSignal.reasonDetail}
          </div>
        </div>
      )}
      {riskStatus?.killSwitchActive && (
        <div className="mx-3 mb-2 px-2 py-1.5 rounded bg-rose-950/50 border border-rose-800 text-rose-400 text-[10px]">
          🛑 Kill switch active — orders blocked. Reason: {riskStatus.killSwitchReason}
        </div>
      )}
    </Panel>
  );
}

/**
 * apps/web/src/components/RecentTrades.tsx
 */
export function RecentTrades() {
  const { recentTrades } = useDashboard();

  return (
    <Panel title="Recent Trades">
      {recentTrades.length === 0 ? (
        <EmptyState msg="Waiting for trades..." />
      ) : (
        <div className="divide-y divide-zinc-800/50">
          {recentTrades.slice(0, 25).map(trade => (
            <div key={trade.id} className="grid grid-cols-3 px-2 py-1 text-[11px] font-mono hover:bg-zinc-800/30">
              <span className={trade.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}>
                ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-zinc-400 text-right">{trade.quantity.toFixed(5)}</span>
              <span className="text-zinc-600 text-right text-[10px]">
                {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

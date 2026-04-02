/**
 * apps/web/src/components/Header.tsx
 * Always-visible header with PAPER MODE banner and live ticker summary.
 */
import { useDashboard } from '../stores/dashboard.store';
import { PnlText } from './ui';

export function Header() {
  const { ticker, wsConnected, portfolio, riskStatus } = useDashboard();

  return (
    <header className="sticky top-0 z-50 flex flex-col">
      {/* PAPER MODE BANNER — non-dismissible */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-400 text-xs font-semibold text-center py-1.5 tracking-wide">
        ⚠️&nbsp; PAPER TRADING ONLY — NOT CONNECTED TO LIVE FUNDS &nbsp;⚠️
      </div>

      {/* Nav bar */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
            <span className="text-sky-400 text-xs font-bold">P</span>
          </div>
          <span className="text-sm font-semibold text-zinc-100">CryptoPaperBot</span>
        </div>

        <div className="w-px h-5 bg-zinc-800" />

        {/* Live ticker summary */}
        {ticker ? (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-zinc-200 font-semibold">{ticker.symbol}</span>
            <span className="text-lg font-semibold text-zinc-100">
              ${ticker.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <PnlText value={ticker.priceChangePct24h} suffix="%" />
            <span className="text-zinc-500">H: ${ticker.high24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span className="text-zinc-500">L: ${ticker.low24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        ) : (
          <span className="text-xs text-zinc-600">Waiting for market data...</span>
        )}

        <div className="flex-1" />

        {/* Portfolio equity */}
        {portfolio && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-zinc-500">Equity</span>
            <span className="font-mono font-semibold text-zinc-100">
              ${portfolio.totalEquityUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <PnlText value={portfolio.returnPct} suffix="%" />
          </div>
        )}

        <div className="w-px h-5 bg-zinc-800" />

        {/* Kill switch status */}
        {riskStatus?.killSwitchActive && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            KILL SWITCH
          </div>
        )}

        {/* Connection status */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'}`} />
          <span className={wsConnected ? 'text-emerald-400' : 'text-red-400'}>
            {wsConnected ? 'Live' : 'Reconnecting'}
          </span>
        </div>
      </div>
    </header>
  );
}

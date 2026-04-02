/**
 * apps/web/src/components/ui.tsx
 * Small shared UI primitives used across every panel.
 */
import clsx from 'clsx';
import { ReactNode } from 'react';

export function Panel({ title, children, className }: {
  title?: string; children: ReactNode; className?: string;
}) {
  return (
    <div className={clsx('bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col', className)}>
      {title && (
        <div className="px-3 py-2 border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          {title}
        </div>
      )}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

export function PnlText({ value, suffix = '%', className = '' }: {
  value: number | undefined | null; suffix?: string; className?: string;
}) {
  if (value === undefined || value === null) return <span className="text-zinc-500">—</span>;
  const cls = value > 0 ? 'text-emerald-400' : value < 0 ? 'text-rose-400' : 'text-zinc-400';
  const sign = value > 0 ? '+' : '';
  return <span className={clsx(cls, className)}>{sign}{value.toFixed(2)}{suffix}</span>;
}

export function Num({ v, decimals = 2, className = '' }: {
  v: number | undefined | null; decimals?: number; className?: string;
}) {
  if (v === undefined || v === null) return <span className="text-zinc-500">—</span>;
  return <span className={clsx('font-mono', className)}>{v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
}

export function Badge({ children, color = 'zinc' }: { children: ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    zinc: 'bg-zinc-800 text-zinc-300',
    emerald: 'bg-emerald-950 text-emerald-400 border border-emerald-800',
    rose: 'bg-rose-950 text-rose-400 border border-rose-800',
    amber: 'bg-amber-950 text-amber-400 border border-amber-800',
    sky: 'bg-sky-950 text-sky-400 border border-sky-800',
  };
  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded font-mono', colors[color] ?? colors['zinc'])}>
      {children}
    </span>
  );
}

export function EmptyState({ msg }: { msg: string }) {
  return <div className="p-4 text-center text-zinc-600 text-xs">{msg}</div>;
}

export function Row({ label, value, valueClass = '' }: {
  label: string; value: ReactNode; valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 text-xs border-b border-zinc-800/50 last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className={clsx('font-mono text-right', valueClass)}>{value}</span>
    </div>
  );
}

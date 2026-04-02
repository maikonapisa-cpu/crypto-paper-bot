/**
 * apps/web/src/stores/dashboard.store.ts
 * Single store for all real-time dashboard state.
 */
import { create } from 'zustand';

// ---------- types (mirrors shared-types, local copies for web) ----------

export interface Ticker {
  symbol: string;
  bidPrice: number;
  askPrice: number;
  midPrice: number;
  lastPrice: number;
  priceChangePct24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: string;
}

export interface Candle {
  symbol: string;
  interval: string;
  openTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
}

export interface OrderBookLevel { price: number; quantity: number; }
export interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: string;
}

export interface RecentTrade {
  id: string;
  symbol: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  timestamp: string;
}

export interface Position {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  openedAt: string;
}

export interface AssetBalance { asset: string; free: number; locked: number; totalUsdt: number; }
export interface Portfolio {
  totalEquityUsdt: number;
  availableUsdt: number;
  unrealizedPnl: number;
  realizedPnlSession: number;
  realizedPnlAllTime: number;
  returnPct: number;
  initialBalance: number;
  assets: AssetBalance[];
}

export interface JournalEntry {
  id: string;
  symbol: string;
  side: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  netPnlUsdt?: number;
  netPnlPct?: number;
  totalFeesUsdt: number;
  entrySignalReasonCode: string;
  exitSignalReasonCode?: string;
  openedAt: string;
  closedAt?: string;
  durationMs?: number;
  outcome?: 'win' | 'loss' | 'breakeven' | 'open';
}

export interface Signal {
  id: string;
  symbol: string;
  action: string;
  reasonCode: string;
  reasonDetail: string;
  confidence: number;
  referencePrice: number;
  timestamp: string;
}

export interface SystemHealth {
  component: string;
  severity: string;
  eventType: string;
  detail: string;
  timestamp: string;
}

export interface AdapterHealth {
  connected: boolean;
  lastMessageAt: string | null;
  reconnectCount: number;
  isStale: boolean;
}

export interface Metrics {
  totalTrades: number;
  winRate: number;
  averageReturnPct: number;
  profitFactor: number;
  maxDrawdownPct: number;
  takeProfitHitRate: number;
  totalNetPnlUsdt: number;
  totalFeesUsdt: number;
}

// ---------- store ----------

interface DashboardState {
  // Connection
  wsConnected: boolean;
  setWsConnected: (v: boolean) => void;

  // Market data
  ticker: Ticker | null;
  candles: Candle[];
  orderBook: OrderBook | null;
  recentTrades: RecentTrade[];

  // Portfolio & positions
  portfolio: Portfolio | null;
  positions: Position[];
  journal: JournalEntry[];

  // Strategy & risk
  latestSignal: Signal | null;
  healthEvents: SystemHealth[];
  adapterHealth: AdapterHealth | null;
  riskStatus: { killSwitchActive: boolean; killSwitchReason: string } | null;
  strategyConfig: Record<string, unknown> | null;

  // Analytics
  metrics: Metrics | null;

  // Actions
  onWsMessage: (type: string, payload: unknown) => void;
}

export const useDashboard = create<DashboardState>((set, get) => ({
  wsConnected: false,
  setWsConnected: (v) => set({ wsConnected: v }),

  ticker: null,
  candles: [],
  orderBook: null,
  recentTrades: [],
  portfolio: null,
  positions: [],
  journal: [],
  latestSignal: null,
  healthEvents: [],
  adapterHealth: null,
  riskStatus: null,
  strategyConfig: null,
  metrics: null,

  onWsMessage: (type, payload) => {
    switch (type) {
      case 'ticker':
        set({ ticker: payload as Ticker });
        break;

      case 'candle': {
        const incoming = payload as Candle | Candle[];
        const arr = Array.isArray(incoming) ? incoming : [incoming];
        set(s => {
          // Merge: replace matching openTime+symbol, append new
          const map = new Map(s.candles.map(c => [`${c.symbol}:${c.openTime}`, c]));
          for (const c of arr) map.set(`${c.symbol}:${c.openTime}`, c);
          const merged = [...map.values()].sort(
            (a, b) => new Date(a.openTime).getTime() - new Date(b.openTime).getTime()
          );
          return { candles: merged.slice(-200) };
        });
        break;
      }

      case 'orderbook':
        set({ orderBook: payload as OrderBook });
        break;

      case 'trade':
        set(s => ({ recentTrades: [payload as RecentTrade, ...s.recentTrades].slice(0, 50) }));
        break;

      case 'portfolio_update':
        set({ portfolio: payload as Portfolio });
        break;

      case 'position_update':
        set({ positions: Array.isArray(payload) ? payload as Position[] : [payload as Position] });
        break;

      case 'signal':
        set({ latestSignal: payload as Signal });
        break;

      case 'health_event': {
        const ev = payload as SystemHealth;
        set(s => ({ healthEvents: [ev, ...s.healthEvents].slice(0, 30) }));
        if ((ev as any).adapterHealth) set({ adapterHealth: (ev as any).adapterHealth });
        break;
      }

      case 'journal_entry':
        set(s => ({ journal: [payload as JournalEntry, ...s.journal] }));
        break;

      case 'analytics_update':
        if ((payload as any).winRate !== undefined) set({ metrics: payload as Metrics });
        break;

      case 'risk_status':
        set({ riskStatus: payload as any });
        break;
    }
    void get; // suppress unused warning
  },
}));

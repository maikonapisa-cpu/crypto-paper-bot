import Head from 'next/head';
import { useEffect, useState } from 'react';

const tabs = ['Office', 'Agents', 'Logs', 'Settings'];

function Tooltip({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-cyan-300/40 bg-[#0b1220] px-2 py-1 text-[10px] text-cyan-100 shadow-lg">
      {label}
      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#0b1220]" />
    </div>
  );
}

function SpeechBubble({ text }: { text: string }) {
  return (
    <div className="absolute -top-16 left-1/2 -translate-x-1/2 rounded-md border-4 border-[#e5e7eb] bg-[#f8fafc] px-3 py-1 text-[11px] text-[#0f172a] shadow-lg whitespace-nowrap">
      {text}
      <div className="absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-[#e5e7eb]" />
    </div>
  );
}

function PixelFace({ variant }: { variant: 'chris' | 'atlas' }) {
  return (
    <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-[1px] p-[3px]">
      {/* head background */}
      {Array.from({ length: 36 }).map((_, i) => {
        const x = i % 6;
        const y = Math.floor(i / 6);
        const isEye = y === 2 && (x === 2 || x === 3);
        const isMouth = y === 4 && x >= 2 && x <= 3;
        const isCheek = y === 3 && (x === 1 || x === 4);
        const skin = variant === 'chris' ? '#c084fc' : '#86efac';
        const detail = variant === 'chris' ? '#1f1147' : '#064e3b';
        const mouth = variant === 'chris' ? '#fff7ed' : '#dcfce7';
        const background = isEye ? detail : isMouth ? mouth : isCheek ? detail : skin;
        return <div key={i} className="w-full h-full rounded-[1px]" style={{ backgroundColor: background }} />;
      })}
    </div>
  );
}

function PixelSprite({ variant, frame = 0 }: { variant: 'chris' | 'atlas'; frame?: number }) {
  const palette =
    variant === 'chris'
      ? { body: '#7c3aed', trim: '#c084fc', light: '#ede9fe', dark: '#1e1b4b', face: '#f5d0fe' }
      : { body: '#16a34a', trim: '#86efac', light: '#dcfce7', dark: '#052e16', face: '#bbf7d0' };

  const base = [
    [0, 0, 1, 1, 0, 0, 0, 0],
    [0, 1, 2, 2, 1, 0, 0, 0],
    [1, 2, 3, 3, 2, 1, 0, 0],
    [1, 2, 4, 4, 3, 2, 1, 0],
    [1, 2, 4, 4, 3, 2, 1, 0],
    [0, 1, 2, 3, 2, 1, 0, 0],
    [0, 2, 0, 2, 2, 0, 2, 0],
    [2, 2, 0, 2, 2, 0, 2, 2],
  ];

  const pose =
    frame % 2 === 1
      ? base.map((row, y) =>
          row.map((cell, x) => {
            if (y === 6 && x === 1) return 0;
            if (y === 6 && x === 6) return 2;
            if (y === 7 && x === 1) return 2;
            if (y === 7 && x === 6) return 0;
            return cell;
          }),
        )
      : base;

  return (
    <div className="relative grid grid-cols-8 gap-[1px] w-12 h-12 mx-auto pixel-sprite">
      {pose.flatMap((row, y) =>
        row.map((cell, x) => {
          if (cell === 0) return <div key={`${y}-${x}`} className="w-full h-full" />;
          const color = cell === 1 ? palette.dark : cell === 2 ? palette.body : cell === 3 ? palette.trim : palette.light;
          return <div key={`${y}-${x}`} className="w-full h-full rounded-[1px]" style={{ backgroundColor: color }} />;
        }),
      )}
      <div className="absolute inset-0"><PixelFace variant={variant} /></div>
    </div>
  );
}

function TileFloor() {
  const rows = 10;
  const cols = 18;
  const tiles = Array.from({ length: rows * cols }).map((_, i) => {
    const x = i % cols;
    const y = Math.floor(i / cols);
    const variant = (x + y) % 3;
    const colors = ['#233043', '#1f2a3b', '#2a394d'];
    return colors[variant];
  });

  return (
    <div className="absolute inset-x-0 bottom-0 h-[32%] grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
      {tiles.map((color, i) => (
        <div key={i} className="border-[1px] border-black/25" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}

function PixelWall() {
  return (
    <div className="absolute left-0 right-0 top-16 h-24 bg-[#3b4d66] border-y-4 border-[#243447]">
      <div className="absolute left-8 top-4 w-40 h-16 bg-[#4b5f7a] border-4 border-[#243447]" />
      <div className="absolute right-8 top-4 w-40 h-16 bg-[#4b5f7a] border-4 border-[#243447]" />
      <div className="absolute inset-x-0 top-8 h-4 bg-[#58708e] opacity-50" />
    </div>
  );
}

function CubicleDesk() {
  return (
    <div className="absolute left-[41%] top-[39%] w-60 h-36">
      <div className="absolute left-0 top-0 w-full h-28 rounded-sm bg-[#4b5563] border-4 border-[#273140] shadow-xl" />
      <div className="absolute left-4 top-[-12px] w-28 h-12 rounded-sm bg-[#8b5a2b] border-4 border-[#5b3b1f] shadow-lg" />
      <div className="absolute left-8 top-8 w-24 h-4 bg-[#1f2937] border border-white/10" />
      <div className="absolute left-6 top-14 w-10 h-10 rounded-sm bg-[#374151] border-4 border-[#111827]" />
      <div className="absolute left-18 top-14 w-10 h-10 rounded-sm bg-[#374151] border-4 border-[#111827]" />
      <div className="absolute right-12 top-10 w-4 h-12 bg-[#c084fc] border-2 border-[#6d28d9]" />
      <div className="absolute inset-x-6 bottom-[-4px] h-4 bg-[#1f2937] border-4 border-[#111827]" />
    </div>
  );
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Office');
  const [atlasActive, setAtlasActive] = useState(false);
  const [atlasFrame, setAtlasFrame] = useState(0);
  const [status, setStatus] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [journalSummary, setJournalSummary] = useState<any>(null);
  const [ticker, setTicker] = useState<any>(null);

  useEffect(() => {
    const id = setInterval(() => setAtlasFrame((f) => (f + 1) % 2), 700);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [statusRes, portfolioRes, journalRes, tickerRes] = await Promise.all([
          fetch(`${API}/api/status`).then((r) => r.json()),
          fetch(`${API}/api/portfolio`).then((r) => r.json()),
          fetch(`${API}/api/journal/summary`).then((r) => r.json()),
          fetch(`${API}/api/market-data/ticker`).then((r) => r.json()),
        ]);

        setStatus(statusRes);
        setPortfolio(portfolioRes);
        setJournalSummary(journalRes);
        setTicker(tickerRes);
      } catch (err) {
        console.warn('Atlas HUD could not load backend data yet:', err);
      }
    };

    void load();
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Head>
        <title>CryptoPaperBot — Office</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col overflow-hidden">
        <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between bg-[#0b1220]">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">CryptoPaperBot</div>
            <h1 className="text-lg font-bold">Office</h1>
          </div>
          <div className="text-[11px] text-zinc-400">Paper mode only</div>
        </header>

        <nav className="flex gap-2 px-4 py-3 border-b border-white/10 bg-[#111827]">
          {tabs.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition border ${
                  active
                    ? 'bg-cyan-400 text-black border-cyan-200 shadow-[0_0_0_2px_rgba(103,232,249,0.18)]'
                    : 'bg-[#1f2937] text-zinc-300 border-[#374151] hover:bg-[#283548] hover:text-white'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </nav>

        <main className="flex-1 p-4">
          {activeTab === 'Office' && (
            <div
              className="relative mx-auto max-w-6xl h-[760px] rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
              style={{ background: 'linear-gradient(#2c3e50 0 16%, #1f2a37 16% 72%, #16202c 72% 100%)' }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 12px 18px, rgba(255,255,255,0.8) 0 1px, transparent 2px), radial-gradient(circle at 120px 80px, rgba(255,255,255,0.7) 0 1px, transparent 2px), radial-gradient(circle at 220px 40px, rgba(255,255,255,0.7) 0 1px, transparent 2px)',
                  backgroundSize: '240px 140px',
                }}
              />

              <div className="absolute inset-x-0 top-0 h-16 bg-[#33475e] border-b border-white/10" />
              <PixelWall />
              <TileFloor />

              <div
                title="Chris — Boss"
                className="absolute left-6 top-6 w-28 text-center select-none"
              >
                <div className="relative mx-auto w-12 h-12">
                  <PixelSprite variant="chris" frame={0} />
                </div>
                <div className="mt-2 text-xs font-bold text-violet-200">Chris</div>
                <div className="text-[10px] text-zinc-400">Boss • stationary</div>
              </div>

              <CubicleDesk />

              <div
                title="Atlas — Paper Trading Agent"
                className="absolute left-[46%] top-[44%] w-20 text-center select-none atlas-walk"
                onMouseEnter={() => setAtlasActive(true)}
                onMouseLeave={() => setAtlasActive(false)}
                onClick={() => setAtlasActive((v) => !v)}
              >
                <div className="relative mx-auto w-12 h-12 atlas-bob pixel-outline cursor-pointer">
                  <PixelSprite variant="atlas" frame={atlasFrame} />
                  <Tooltip label="Atlas" />
                  {atlasActive && <SpeechBubble text="paper loop active" />}
                </div>
                <div className="mt-2 text-xs font-bold text-green-200">Atlas</div>
                <div className="text-[10px] text-zinc-400">Cubicle A1</div>
              </div>

              <div className="absolute right-6 top-6 w-72 rounded-xl border-4 border-[#38bdf8]/30 bg-[#020617]/80 p-4 shadow-2xl backdrop-blur-sm pixel-panel">
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-2">Atlas HUD</div>
                <div className="space-y-2 text-sm text-zinc-200">
                  <div className="flex justify-between"><span>Status</span><span className="text-green-300">{status?.riskStatus?.killSwitchActive ? 'Paused' : 'Running'}</span></div>
                  <div className="flex justify-between"><span>Signal</span><span>{status?.strategyConfig?.strategyId ?? 'HOLD'}</span></div>
                  <div className="flex justify-between"><span>Balance</span><span>{portfolio?.totalEquityUsdt ? `${Number(portfolio.totalEquityUsdt).toFixed(2)} USDT` : 'Loading...'}</span></div>
                  <div className="flex justify-between"><span>PnL</span><span className="text-green-300">{portfolio?.unrealizedPnl ? `${Number(portfolio.unrealizedPnl).toFixed(2)} USDT` : '+0.00 USDT'}</span></div>
                  <div className="flex justify-between"><span>BTC</span><span>{ticker?.symbol ? `${ticker.symbol}` : 'BTC/USDT'}</span></div>
                  <div className="flex justify-between"><span>Price</span><span>{ticker?.midPrice ? `$${Number(ticker.midPrice).toFixed(2)}` : 'waiting...'}</span></div>
                  <div className="flex justify-between"><span>Journal</span><span>{journalSummary?.closedTrades ?? 0} trades</span></div>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 rounded-md border-4 border-white/10 bg-black/35 px-3 py-2 text-xs text-zinc-300 shadow-lg">
                Hover or click Atlas to show his status bubble. Last update: {status?.timestamp ? new Date(status.timestamp).toLocaleTimeString() : 'waiting for backend...'}
              </div>

              <style jsx global>{`
                @keyframes atlasWalk {
                  0% { transform: translateX(0px); }
                  25% { transform: translateX(10px); }
                  50% { transform: translateX(0px); }
                  75% { transform: translateX(-10px); }
                  100% { transform: translateX(0px); }
                }

                @keyframes atlasBob {
                  0% { transform: translateY(0px); }
                  50% { transform: translateY(-3px); }
                  100% { transform: translateY(0px); }
                }

                .atlas-walk {
                  animation: atlasWalk 4s ease-in-out infinite;
                }

                .atlas-bob {
                  animation: atlasBob 1.2s ease-in-out infinite;
                }

                .pixel-outline {
                  box-shadow: 0 0 0 1px rgba(255,255,255,0.12), inset 0 0 0 1px rgba(0,0,0,0.2);
                }

                .pixel-sprite {
                  image-rendering: pixelated;
                  filter: drop-shadow(0 2px 0 rgba(0,0,0,0.35));
                }

                .pixel-panel {
                  image-rendering: pixelated;
                }
              `}</style>
            </div>
          )}

          {activeTab !== 'Office' && (
            <div className="mx-auto max-w-4xl rounded-2xl border-4 border-white/10 bg-[#111827] p-8 text-zinc-300 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-2">{activeTab}</h2>
              <p>This tab is just a placeholder for now.</p>
            </div>
          )}
        </main>

        <footer className="border-t border-zinc-800 px-4 py-2 text-[10px] text-zinc-500 flex items-center justify-between bg-[#0b1220]">
          <span>CryptoPaperBot — Office POC</span>
          <span>Paper mode only. Atlas is a simulated agent.</span>
        </footer>
      </div>
    </>
  );
}

import Head from 'next/head';
import { useState } from 'react';

const tabs = ['Office', 'Agents', 'Logs', 'Settings'];

function Tooltip({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-cyan-300/40 bg-[#0b1220] px-2 py-1 text-[10px] text-cyan-100 shadow-lg">
      {label}
      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#0b1220]" />
    </div>
  );
}

function PixelSprite({ variant }: { variant: 'chris' | 'atlas' }) {
  const colors =
    variant === 'chris'
      ? ['#7c3aed', '#c084fc', '#ede9fe', '#1e1b4b']
      : ['#16a34a', '#86efac', '#dcfce7', '#052e16'];

  const cells = [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 2, 2, 1, 0, 0],
    [0, 1, 2, 3, 3, 2, 1, 0],
    [1, 2, 3, 3, 3, 3, 2, 1],
    [1, 2, 3, 3, 3, 3, 2, 1],
    [0, 1, 2, 3, 3, 2, 1, 0],
    [0, 2, 2, 1, 1, 2, 2, 0],
    [0, 2, 0, 2, 2, 0, 2, 0],
  ];

  return (
    <div className="grid grid-cols-8 gap-[1px] w-12 h-12 mx-auto pixel-sprite">
      {cells.flatMap((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            className="w-full h-full"
            style={{ backgroundColor: cell === 0 ? 'transparent' : colors[cell - 1] }}
          />
        )),
      )}
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Office');

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
              style={{
                background:
                  'linear-gradient(#2c3e50 0 16%, #1f2a37 16% 72%, #16202c 72% 100%)',
              }}
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

              <div className="absolute left-8 top-24 w-44 h-36 rounded-sm bg-[#3b4d66] border-4 border-[#243447] shadow-lg" />
              <div className="absolute right-8 top-24 w-44 h-36 rounded-sm bg-[#3b4d66] border-4 border-[#243447] shadow-lg" />

              <div
                className="absolute inset-x-0 bottom-0 h-[32%] opacity-30"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />

              <div
                title="Chris — Boss"
                className="absolute left-6 top-6 w-28 text-center select-none"
              >
                <div className="relative mx-auto w-12 h-12">
                  <PixelSprite variant="chris" />
                </div>
                <div className="mt-2 text-xs font-bold text-violet-200">Chris</div>
                <div className="text-[10px] text-zinc-400">Boss • stationary</div>
              </div>

              <div className="absolute left-[41%] top-[39%] w-56 h-32 rounded-sm bg-[#4b5563] border-4 border-[#273140] shadow-xl" />
              <div className="absolute left-[43%] top-[33%] w-32 h-12 rounded-sm bg-[#8b5a2b] border-4 border-[#5b3b1f] shadow-lg" />
              <div className="absolute left-[46%] top-[45%] w-20 h-4 bg-[#1f2937] border border-white/10" />
              <div className="absolute left-[44%] top-[50%] w-10 h-10 rounded-sm bg-[#374151] border-4 border-[#111827]" />
              <div className="absolute left-[52%] top-[50%] w-10 h-10 rounded-sm bg-[#374151] border-4 border-[#111827]" />
              <div className="absolute left-[48%] top-[41%] w-4 h-12 bg-[#c084fc] border-2 border-[#6d28d9]" />

              <div
                title="Atlas — Paper Trading Agent"
                className="absolute left-[46%] top-[44%] w-20 text-center select-none atlas-walk"
              >
                <div className="relative mx-auto w-12 h-12 atlas-bob pixel-outline">
                  <PixelSprite variant="atlas" />
                  <Tooltip label="Atlas" />
                </div>
                <div className="mt-2 text-xs font-bold text-green-200">Atlas</div>
                <div className="text-[10px] text-zinc-400">Cubicle A1</div>
              </div>

              <div className="absolute left-[49%] top-[32%] -translate-x-1/2 rounded-md border-4 border-white/10 bg-[#f8fafc] px-3 py-2 text-[11px] text-[#0f172a] shadow-lg">
                paper loop active
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-white/10" />
              </div>

              <div className="absolute right-6 top-6 w-64 rounded-xl border-4 border-[#38bdf8]/30 bg-[#020617]/80 p-4 shadow-2xl backdrop-blur-sm pixel-panel">
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-2">Atlas HUD</div>
                <div className="space-y-2 text-sm text-zinc-200">
                  <div className="flex justify-between"><span>Status</span><span className="text-green-300">Running</span></div>
                  <div className="flex justify-between"><span>Signal</span><span>HOLD</span></div>
                  <div className="flex justify-between"><span>Balance</span><span>10,000 USDT</span></div>
                  <div className="flex justify-between"><span>PnL</span><span className="text-green-300">+0.00%</span></div>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 rounded-md border-4 border-white/10 bg-black/35 px-3 py-2 text-xs text-zinc-300 shadow-lg">
                Hover Atlas to see his name. Chris stays in the top-left.
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

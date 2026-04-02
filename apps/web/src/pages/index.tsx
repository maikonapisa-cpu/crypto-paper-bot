import Head from 'next/head';
import { useState } from 'react';

const tabs = ['Office', 'Agents', 'Logs', 'Settings'];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Office');

  return (
    <>
      <Head>
        <title>CryptoPaperBot — Office</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-[#111827] text-white flex flex-col">
        <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between bg-[#0b1220]">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">CryptoPaperBot</div>
            <h1 className="text-lg font-bold">Office</h1>
          </div>
          <div className="text-[11px] text-zinc-400">Paper mode only</div>
        </header>

        <nav className="flex gap-2 px-4 py-3 border-b border-white/10 bg-[#0f172a]">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-cyan-400 text-black'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <main className="flex-1 p-4">
          {activeTab === 'Office' && (
            <div className="relative mx-auto max-w-6xl h-[760px] rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
              style={{
                background:
                  'linear-gradient(#243447 0 18%, #1f2a37 18% 70%, #16202c 70% 100%)',
              }}
            >
              {/* ceiling */}
              <div className="absolute inset-x-0 top-0 h-16 bg-[#2b3c55] border-b border-white/10" />

              {/* floor grid */}
              <div
                className="absolute inset-x-0 bottom-0 h-[30%] opacity-30"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
                  backgroundSize: '48px 48px',
                }}
              />

              {/* Chris - top left boss */}
              <div
                title="Chris — Boss"
                className="absolute left-8 top-8 w-24 text-center select-none"
              >
                <div className="mx-auto w-12 h-12 rounded-md border border-white/20 bg-[#8b5cf6] shadow-lg flex items-center justify-center text-xl">
                  👑
                </div>
                <div className="mt-2 text-xs font-semibold text-violet-200">
                  Chris
                </div>
                <div className="text-[10px] text-zinc-400">Boss • stationary</div>
              </div>

              {/* desk block */}
              <div className="absolute left-[40%] top-[38%] w-52 h-28 rounded-lg bg-[#3b4a5f] border border-white/10 shadow-xl" />
              <div className="absolute left-[43%] top-[32%] w-28 h-10 rounded-md bg-[#7c5c3c] border border-white/10" />

              {/* Atlas - cubicle worker */}
              <div
                title="Atlas — Paper Trading Agent"
                className="absolute left-[45%] top-[48%] w-20 text-center select-none animate-pulse"
              >
                <div className="mx-auto w-12 h-12 rounded-md border border-white/20 bg-[#22c55e] shadow-lg flex items-center justify-center text-xl">
                  🤖
                </div>
                <div className="mt-2 text-xs font-semibold text-green-200">
                  Atlas
                </div>
                <div className="text-[10px] text-zinc-400">Cubicle A1</div>
              </div>

              {/* cubicle label */}
              <div className="absolute left-[42%] top-[58%] rounded-md bg-black/40 border border-white/10 px-3 py-1 text-xs text-zinc-200">
                Paper trading loop active
              </div>

              {/* HUD */}
              <div className="absolute right-6 top-6 w-64 rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-2">Atlas HUD</div>
                <div className="space-y-2 text-sm text-zinc-200">
                  <div className="flex justify-between"><span>Status</span><span className="text-green-300">Running</span></div>
                  <div className="flex justify-between"><span>Signal</span><span>HOLD</span></div>
                  <div className="flex justify-between"><span>Balance</span><span>10,000 USDT</span></div>
                  <div className="flex justify-between"><span>PnL</span><span className="text-green-300">+0.00%</span></div>
                </div>
              </div>

              {/* footer hint */}
              <div className="absolute bottom-4 left-4 rounded-md border border-white/10 bg-black/35 px-3 py-2 text-xs text-zinc-300">
                Hover Atlas to see his name. Chris stays in the top-left.
              </div>
            </div>
          )}

          {activeTab !== 'Office' && (
            <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-8 text-zinc-300">
              <h2 className="text-2xl font-bold text-white mb-2">{activeTab}</h2>
              <p>This tab is just a placeholder for now.</p>
            </div>
          )}
        </main>

        <footer className="border-t border-zinc-800 px-4 py-2 text-[10px] text-zinc-500 flex items-center justify-between">
          <span>CryptoPaperBot — Office POC</span>
          <span>Paper mode only. Atlas is a simulated agent.</span>
        </footer>
      </div>
    </>
  );
}

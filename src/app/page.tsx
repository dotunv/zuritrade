"use client";

import Link from "next/link";
import { useAuth } from "../lib/AuthContext";
import { mockMarkets } from "../lib/mockData";

const STEPS = [
  {
    num: "01",
    title: "Create Agent",
    desc: "Name your agent, choose a personality. It gets its own ERC-8004 smart wallet on Base.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 10-16 0" /></svg>
    ),
  },
  {
    num: "02",
    title: "Configure Strategy",
    desc: "Set market focus, risk level, position limits, and trading rules. The agent follows them autonomously.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
    ),
  },
  {
    num: "03",
    title: "Deploy & Earn",
    desc: "Your agent monitors markets 24/7, executes trades, and manages risk — all on-chain, all autonomous.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
    ),
  },
];

const FEATURES = [
  { title: "ERC-8004 Agent Wallets", desc: "Each agent gets a permissioned smart wallet. Your keys, your rules, your limits.", icon: "🔐" },
  { title: "Autonomous Execution", desc: "Agents monitor political signals and execute trades 24/7 without supervision.", icon: "⚡" },
  { title: "African Political Markets", desc: "Trade on Nigerian elections, SA policy, Kenyan economics, and more.", icon: "🌍" },
  { title: "On-Chain Transparency", desc: "Every trade, every decision — verifiable on Base. No black boxes.", icon: "🔗" },
  { title: "Risk Controls", desc: "Set position limits, daily loss caps, and max trade sizes. The agent obeys.", icon: "🛡️" },
  { title: "Real-Time Dashboard", desc: "Track P&L, open positions, trade history, and agent performance live.", icon: "📊" },
];

export default function LandingPage() {
  const { connect, isConnecting, isConnected } = useAuth();

  return (
    <main>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="max-w-[1200px] mx-auto px-4 pt-24 pb-20">
          <div className="inline-flex items-center gap-2 bg-accent/8 px-4 py-1.5 rounded-full text-xs font-mono font-medium text-accent border border-accent/20 tracking-widest uppercase mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            Live on Base
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-white uppercase leading-[0.95] mb-6">
            Autonomous Agents<br />
            That Trade<br />
            <span className="text-gradient-accent">African Politics</span>
          </h1>

          <p className="text-lg text-muted max-w-lg mb-10">
            Deploy AI-powered trading agents on African political prediction markets.
            They monitor signals, execute trades, and manage risk — all on-chain, all autonomous.
          </p>

          <div className="flex flex-wrap gap-4">
            {isConnected ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-accent text-[#0a0a0a] px-7 py-3.5 rounded-lg font-bold text-sm hover:bg-accent-hover transition-colors no-underline"
              >
                Go to Dashboard
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 bg-accent text-[#0a0a0a] px-7 py-3.5 rounded-lg font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer border-0"
              >
                {isConnecting ? "Connecting..." : "Get Started"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            )}
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 bg-transparent text-white px-7 py-3.5 rounded-lg font-semibold text-sm border border-border hover:bg-surface transition-colors no-underline"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>
              Read Docs
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-b border-border">
          <div className="max-w-[1200px] mx-auto px-4 py-5 flex flex-wrap gap-8 md:gap-16">
            {[
              { value: "$5.2M", label: "Total Volume" },
              { value: "8", label: "Active Markets" },
              { value: "6,406", label: "Traders" },
              { value: "Base", label: "Network" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl md:text-3xl font-black text-white font-mono tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted font-mono tracking-widest uppercase mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24">
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-3">
            Three steps to<br />
            <span className="text-gradient-accent">Autonomous Alpha</span>
          </h2>
          <p className="text-muted mb-16 max-w-lg">
            From wallet connection to autonomous trading in minutes. No code required.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div key={step.num} className="border border-border rounded-xl p-6 bg-surface card-glow">
                <div className="flex items-center gap-3 mb-4">
                  <span className="step-number">{step.num}</span>
                  <div className="text-accent">{step.icon}</div>
                </div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-2">{step.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE MARKETS ── */}
      <section className="py-24 border-t border-border">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
              Live Markets
            </h2>
            <span className="hidden sm:inline text-muted text-sm font-mono">{mockMarkets.length} active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockMarkets.slice(0, 4).map((market) => (
              <div
                key={market.id}
                className="border border-border rounded-xl p-5 bg-surface card-glow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded">
                    {market.region.replace("-", " ")}
                  </span>
                  <span className="text-xs font-mono uppercase tracking-wider text-muted">
                    {market.category}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-3 leading-snug line-clamp-2">
                  {market.title}
                </h3>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-muted font-mono uppercase tracking-widest">Probability</p>
                    <p className="text-xl font-black text-white font-mono">{(market.probability * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted font-mono uppercase tracking-widest">Volume</p>
                    <p className="text-sm font-bold text-white font-mono">${(market.volume / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 border-t border-border">
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-center mb-3">
            Built for<br />
            <span className="text-gradient-accent">Autonomous Trading</span>
          </h2>
          <p className="text-muted text-center mb-16 max-w-lg mx-auto">
            Everything you need to deploy, configure, and monitor autonomous trading agents.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="border border-border rounded-xl p-6 bg-surface card-glow">
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 border-t border-border text-center">
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-3">
            Start Trading<br />
            <span className="text-gradient-accent">In Minutes</span>
          </h2>
          <p className="text-muted mb-10 max-w-lg mx-auto">
            Connect your wallet, create an agent, and let it trade African political markets autonomously.
          </p>
          {isConnected ? (
            <Link
              href="/agents/create"
              className="inline-flex items-center gap-3 bg-accent text-[#0a0a0a] px-8 py-4 rounded-lg font-bold text-sm hover:bg-accent-hover transition-colors no-underline"
            >
              Create Your First Agent
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="inline-flex items-center gap-3 bg-accent text-[#0a0a0a] px-8 py-4 rounded-lg font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer border-0"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet to Start"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

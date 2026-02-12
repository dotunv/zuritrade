"use client";

import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";
import {
    mockAgents,
    mockTrades,
    mockPerformanceData,
    getPortfolioStats,
} from "../../lib/mockData";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

export default function DashboardPage() {
    const { isConnected, connect, isConnecting } = useAuth();
    const stats = getPortfolioStats();

    if (!isConnected) {
        return (
            <main className="min-h-[70vh] flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M22 10H2M7 15h.01M11 15h.01" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
                    <p className="text-muted text-sm mb-6">Connect your wallet to access your agent dashboard and start trading.</p>
                    <button
                        onClick={connect}
                        disabled={isConnecting}
                        className="inline-flex items-center gap-2 bg-accent text-[#0a0a0a] px-6 py-3 rounded-lg font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer border-0"
                    >
                        {isConnecting ? "Connecting..." : "Connect Wallet"}
                    </button>
                </div>
            </main>
        );
    }

    const recentTrades = mockTrades.slice(0, 5);

    return (
        <main className="max-w-[1200px] mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
                    <p className="text-muted text-sm">Monitor your agents, positions, and performance.</p>
                </div>
                <Link
                    href="/agents/create"
                    className="inline-flex items-center gap-2 bg-accent text-[#0a0a0a] px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-accent-hover transition-colors no-underline shrink-0"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    Create Agent
                </Link>
            </div>

            {/* Portfolio Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Total Capital", value: `$${stats.totalCapital.toLocaleString()}`, sub: `${stats.totalAgents} agents` },
                    { label: "Total P&L", value: `${stats.totalPnl >= 0 ? "+" : ""}$${stats.totalPnl.toLocaleString()}`, sub: `${stats.totalPnlPercent.toFixed(1)}%`, isProfit: stats.totalPnl >= 0 },
                    { label: "Win Rate", value: `${(stats.avgWinRate * 100).toFixed(0)}%`, sub: `${stats.totalTrades} trades` },
                    { label: "Active Agents", value: `${stats.activeAgents}`, sub: `of ${stats.totalAgents}` },
                ].map((s) => (
                    <div key={s.label} className="border border-border rounded-xl p-5 bg-surface">
                        <p className="text-xs text-muted font-mono tracking-widest uppercase mb-2">{s.label}</p>
                        <p className={`text-2xl font-black font-mono tracking-tight ${s.isProfit === true ? "text-success" : s.isProfit === false ? "text-danger" : "text-white"}`}>
                            {s.value}
                        </p>
                        <p className="text-xs text-muted mt-1">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Performance Chart */}
            <div className="border border-border rounded-xl p-6 bg-surface mb-8">
                <h2 className="text-base font-bold text-white mb-4">Portfolio Performance</h2>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockPerformanceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                            <Tooltip
                                contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", fontSize: "12px" }}
                                labelStyle={{ color: "#888" }}
                                formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(2)}`, "Cumulative P&L"]}
                            />
                            <Line type="monotone" dataKey="cumulative" stroke="#f59e0b" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Agents Grid */}
            <div className="mb-8">
                <h2 className="text-base font-bold text-white mb-4">Your Agents</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {mockAgents.map((agent) => (
                        <Link
                            key={agent.id}
                            href={`/agents/${agent.id}`}
                            className="border border-border rounded-xl p-5 bg-surface card-glow no-underline group block"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-white group-hover:text-accent transition-colors">{agent.name}</h3>
                                <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${agent.status === "active" ? "text-success border-success/20 bg-success/5" :
                                    agent.status === "paused" ? "text-accent border-accent/20 bg-accent/5" :
                                        "text-danger border-danger/20 bg-danger/5"
                                    }`}>
                                    {agent.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[10px] text-muted font-mono tracking-widest uppercase mb-0.5">P&L</p>
                                    <p className={`text-lg font-black font-mono ${agent.pnl >= 0 ? "text-success" : "text-danger"}`}>
                                        {agent.pnl >= 0 ? "+" : ""}${Math.abs(agent.pnl).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted font-mono tracking-widest uppercase mb-0.5">Win Rate</p>
                                    <p className="text-lg font-black font-mono text-white">{(agent.winRate * 100).toFixed(0)}%</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted font-mono tracking-widest uppercase mb-0.5">Trades</p>
                                    <p className="text-lg font-black font-mono text-white">{agent.totalTrades}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted font-mono tracking-widest uppercase mb-0.5">Positions</p>
                                    <p className="text-lg font-black font-mono text-white">{agent.openPositions}</p>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                                <span className="text-xs text-muted font-mono">{agent.strategyType}</span>
                                <span className="text-xs text-muted">{agent.marketFocus.regions.map((r) => r.replace("-", " ")).join(", ")}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Trades */}
            <div className="border border-border rounded-xl bg-surface overflow-hidden">
                <div className="p-5 pb-0">
                    <h2 className="text-base font-bold text-white mb-4">Recent Trades</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">Agent</th>
                                <th className="text-left text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">Market</th>
                                <th className="text-left text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">Side</th>
                                <th className="text-right text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">Amount</th>
                                <th className="text-right text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">P&L</th>
                                <th className="text-right text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">Tx</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTrades.map((trade) => (
                                <tr key={trade.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                                    <td className="px-5 py-3 text-white font-medium">{trade.agentName}</td>
                                    <td className="px-5 py-3 text-muted max-w-[200px] truncate">{trade.marketTitle}</td>
                                    <td className="px-5 py-3">
                                        <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded ${trade.direction === "buy" ? "text-success bg-success/10" : "text-danger bg-danger/10"
                                            }`}>
                                            {trade.direction}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right font-mono text-white">${trade.amount}</td>
                                    <td className={`px-5 py-3 text-right font-mono font-bold ${trade.pnl === null ? "text-muted" : trade.pnl >= 0 ? "text-success" : "text-danger"
                                        }`}>
                                        {trade.pnl === null ? "—" : `${trade.pnl >= 0 ? "+" : ""}$${trade.pnl.toFixed(0)}`}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <span className="text-xs font-mono text-muted">{trade.txHash.slice(0, 10)}...</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}

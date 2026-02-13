"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useAuth } from "../../../lib/AuthContext";
import {
    useAgent,
    useTrades,
    usePositions,
} from "../../../lib/hooks";
import { mockPerformanceData } from "../../../lib/mockData";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { isConnected, connect, isConnecting } = useAuth();
    const [tab, setTab] = useState<"positions" | "trades" | "config">("positions");

    const { data: agentData, isPending: agentLoading } = useAgent(id);
    const { data: tradesData } = useTrades(id);
    const { data: positionsData } = usePositions(id);

    const agent = agentData ?? null;
    const trades = tradesData?.trades ?? [];
    const positions = positionsData?.positions ?? [];

    if (!isConnected) {
        return (
            <main className="min-h-[70vh] flex items-center justify-center">
                <div className="text-center max-w-md">
                    <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
                    <p className="text-muted text-sm mb-6">Connect to view agent details.</p>
                    <button onClick={connect} disabled={isConnecting} className="bg-accent text-[#0a0a0a] px-6 py-3 rounded-lg font-bold text-sm cursor-pointer border-0">
                        {isConnecting ? "Connecting..." : "Connect Wallet"}
                    </button>
                </div>
            </main>
        );
    }

    if (agentLoading) {
        return (
            <main className="min-h-[70vh] flex items-center justify-center">
                <div className="text-center">
                    <span className="text-muted">Loading...</span>
                </div>
            </main>
        );
    }

    if (!agent) {
        return (
            <main className="min-h-[70vh] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Agent Not Found</h2>
                    <Link href="/dashboard" className="text-accent text-sm no-underline">← Back to Dashboard</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-[1200px] mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted mb-6">
                <Link href="/dashboard" className="hover:text-white transition-colors no-underline text-muted">Dashboard</Link>
                <span>/</span>
                <span className="text-white">{agent.name}</span>
            </div>

            {/* Agent Header */}
            <div className="border border-border rounded-xl p-6 bg-surface mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
                            <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${agent.status === "active" ? "text-success border-success/20 bg-success/5" :
                                agent.status === "paused" ? "text-accent border-accent/20 bg-accent/5" :
                                    "text-danger border-danger/20 bg-danger/5"
                                }`}>
                                {agent.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted">
                            <span className="font-mono">{agent.walletAddress}</span>
                            <span>·</span>
                            <span>{agent.strategyType} strategy</span>
                            <span>·</span>
                            <span>{agent.riskLevel} risk</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className={`text-sm px-4 py-2 rounded-lg font-medium cursor-pointer border transition-colors ${agent.status === "active"
                            ? "border-accent/30 text-accent bg-accent/5 hover:bg-accent/10"
                            : "border-success/30 text-success bg-success/5 hover:bg-success/10"
                            }`}>
                            {agent.status === "active" ? "⏸ Pause" : "▶ Resume"}
                        </button>
                        <button className="text-sm px-4 py-2 rounded-lg font-medium cursor-pointer border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 transition-colors">
                            ■ Stop
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {[
                    { label: "P&L", value: `${agent.pnl >= 0 ? "+" : ""}$${Math.abs(agent.pnl).toLocaleString()}`, sub: `${agent.pnlPercent >= 0 ? "+" : ""}${agent.pnlPercent.toFixed(1)}%`, color: agent.pnl >= 0 ? "text-success" : "text-danger" },
                    { label: "Capital", value: `$${agent.capitalAllocated.toLocaleString()}`, sub: `$${agent.capitalUsed.toLocaleString()} used`, color: "text-white" },
                    { label: "Win Rate", value: `${(agent.winRate * 100).toFixed(0)}%`, sub: `${agent.totalTrades} trades`, color: "text-white" },
                    { label: "Open Positions", value: String(agent.openPositions), sub: `of ${agent.positionLimit} max`, color: "text-white" },
                    { label: "Last Trade", value: agent.lastTradeAt ? new Date(agent.lastTradeAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) : "—", sub: agent.lastTradeAt ? new Date(agent.lastTradeAt).toLocaleDateString("en", { month: "short", day: "numeric" }) : "", color: "text-white" },
                ].map((s) => (
                    <div key={s.label} className="border border-border rounded-xl p-4 bg-surface">
                        <p className="text-[10px] text-muted font-mono tracking-widest uppercase mb-1">{s.label}</p>
                        <p className={`text-xl font-black font-mono tracking-tight ${s.color}`}>{s.value}</p>
                        {s.sub && <p className="text-xs text-muted mt-0.5">{s.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Performance Chart */}
            <div className="border border-border rounded-xl p-6 bg-surface mb-6">
                <h2 className="text-sm font-bold text-white mb-4">Performance</h2>
                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockPerformanceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                            <Tooltip
                                contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", fontSize: "12px" }}
                                labelStyle={{ color: "#888" }}
                                formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(2)}`, "P&L"]}
                            />
                            <Line type="monotone" dataKey="cumulative" stroke="#f59e0b" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-4 border-b border-border pb-px">
                {(["positions", "trades", "config"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`text-sm font-medium px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer border-0 capitalize ${tab === t ? "bg-surface text-white border-b-2 border-b-accent" : "bg-transparent text-muted hover:text-white"
                            }`}
                    >
                        {t === "positions" ? `Positions (${positions.filter(p => p.status === "open").length})` : t === "trades" ? `Trades (${trades.length})` : "Config"}
                    </button>
                ))}
            </div>

            <div className="border border-border rounded-xl bg-surface overflow-hidden">
                {/* Positions Tab */}
                {tab === "positions" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">Market</th>
                                    <th className="text-left text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">Side</th>
                                    <th className="text-right text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">Entry</th>
                                    <th className="text-right text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">Current</th>
                                    <th className="text-right text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">Amount</th>
                                    <th className="text-right text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">Unrealized P&L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {positions.filter(p => p.status === "open").map((pos) => (
                                    <tr key={pos.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                                        <td className="px-5 py-3 text-white font-medium max-w-[250px] truncate">{pos.marketTitle}</td>
                                        <td className="px-5 py-3">
                                            <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded ${pos.direction === "buy" ? "text-success bg-success/10" : "text-danger bg-danger/10"
                                                }`}>{pos.direction}</span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-mono text-muted">${pos.entryPrice.toFixed(2)}</td>
                                        <td className="px-5 py-3 text-right font-mono text-white">${pos.currentPrice.toFixed(2)}</td>
                                        <td className="px-5 py-3 text-right font-mono text-white">${pos.amount}</td>
                                        <td className={`px-5 py-3 text-right font-mono font-bold ${pos.unrealizedPnl >= 0 ? "text-success" : "text-danger"}`}>
                                            {pos.unrealizedPnl >= 0 ? "+" : ""}${pos.unrealizedPnl.toFixed(2)} ({pos.unrealizedPnlPercent >= 0 ? "+" : ""}{pos.unrealizedPnlPercent.toFixed(1)}%)
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Trades Tab */}
                {tab === "trades" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">Time</th>
                                    <th className="text-left text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">Market</th>
                                    <th className="text-left text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">Side</th>
                                    <th className="text-right text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">Amount</th>
                                    <th className="text-right text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">Price</th>
                                    <th className="text-right text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">P&L</th>
                                    <th className="text-right text-xs text-muted font-mono tracking-widest uppercase px-5 py-3">Tx Hash</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trades.map((trade) => (
                                    <tr key={trade.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                                        <td className="px-5 py-3 text-muted font-mono text-xs">
                                            {new Date(trade.timestamp).toLocaleDateString("en", { month: "short", day: "numeric" })}{" "}
                                            {new Date(trade.timestamp).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                                        </td>
                                        <td className="px-5 py-3 text-white max-w-[200px] truncate">{trade.marketTitle}</td>
                                        <td className="px-5 py-3">
                                            <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded ${trade.direction === "buy" ? "text-success bg-success/10" : "text-danger bg-danger/10"
                                                }`}>{trade.direction}</span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-mono text-white">${trade.amount}</td>
                                        <td className="px-5 py-3 text-right font-mono text-muted">${trade.price.toFixed(2)}</td>
                                        <td className={`px-5 py-3 text-right font-mono font-bold ${trade.pnl === null ? "text-muted" : trade.pnl >= 0 ? "text-success" : "text-danger"
                                            }`}>
                                            {trade.pnl === null ? "—" : `${trade.pnl >= 0 ? "+" : ""}$${trade.pnl.toFixed(0)}`}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <span className="text-xs font-mono text-muted bg-[#0a0a0a] px-2 py-0.5 rounded">{trade.txHash.slice(0, 10)}...</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Config Tab */}
                {tab === "config" && (
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-bold text-white mb-4">Strategy Configuration</h3>
                                <div className="space-y-3">
                                    {[
                                        { label: "Strategy Type", value: agent.strategyType },
                                        { label: "Risk Level", value: agent.riskLevel },
                                        { label: "Max Trade Size", value: `$${agent.maxTradeSize.toLocaleString()} USDC` },
                                        { label: "Daily Loss Limit", value: `$${agent.dailyLossLimit.toLocaleString()} USDC` },
                                        { label: "Position Limit", value: String(agent.positionLimit) },
                                    ].map((r) => (
                                        <div key={r.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                            <span className="text-xs text-muted font-mono tracking-widest uppercase">{r.label}</span>
                                            <span className="text-sm text-white capitalize">{r.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white mb-4">Market Focus</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-muted font-mono tracking-widest uppercase mb-2">Regions</p>
                                        <div className="flex flex-wrap gap-2">
                                            {agent.marketFocus.regions.map((r) => (
                                                <span key={r} className="text-xs font-mono px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20 capitalize">
                                                    {r.replace("-", " ")}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted font-mono tracking-widest uppercase mb-2">Categories</p>
                                        <div className="flex flex-wrap gap-2">
                                            {agent.marketFocus.categories.map((c) => (
                                                <span key={c} className="text-xs font-mono px-2 py-1 rounded bg-surface text-muted border border-border capitalize">
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-xs text-muted font-mono tracking-widest uppercase mb-1">Wallet Address</p>
                                        <p className="text-sm text-white font-mono">{agent.walletAddress}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted font-mono tracking-widest uppercase mb-1">Deployed</p>
                                        <p className="text-sm text-white">{new Date(agent.deployedAt).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

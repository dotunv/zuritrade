"use client";

import { use } from "react";
import Link from "next/link";
import { mockMarkets } from "../../../lib/mockData";

export default function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const market = mockMarkets.find((m) => m.id === id);

    if (!market) {
        return (
            <main className="min-h-[70vh] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Market Not Found</h2>
                    <Link href="/" className="text-accent text-sm no-underline">← Back to Home</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-[900px] mx-auto px-4 py-8">
            <Link href="/" className="text-muted text-sm hover:text-white transition-colors no-underline mb-6 inline-block">← Back to Markets</Link>

            <div className="border border-border rounded-xl p-6 bg-surface mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-mono uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded">
                        {market.region.replace("-", " ")}
                    </span>
                    <span className="text-xs font-mono uppercase tracking-wider text-muted">
                        {market.category}
                    </span>
                    <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded ml-auto ${market.status === "active" ? "text-success bg-success/10" : "text-muted bg-surface"
                        }`}>
                        {market.status}
                    </span>
                </div>

                <h1 className="text-2xl font-bold text-white mb-3">{market.title}</h1>
                <p className="text-muted text-sm leading-relaxed mb-6">{market.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-[10px] text-muted font-mono tracking-widest uppercase mb-1">Probability</p>
                        <p className="text-2xl font-black font-mono text-white">{(market.probability * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted font-mono tracking-widest uppercase mb-1">Volume</p>
                        <p className="text-2xl font-black font-mono text-white">${(market.volume / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted font-mono tracking-widest uppercase mb-1">Traders</p>
                        <p className="text-2xl font-black font-mono text-white">{market.totalTraders.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted font-mono tracking-widest uppercase mb-1">Ends</p>
                        <p className="text-lg font-bold font-mono text-white">{new Date(market.endDate).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                </div>
            </div>

            <div className="border border-border rounded-xl p-6 bg-surface">
                <h2 className="text-sm font-bold text-white mb-3">About This Market</h2>
                <p className="text-muted text-sm leading-relaxed">{market.description}</p>
                <div className="mt-4 pt-4 border-t border-border text-xs text-muted font-mono">
                    Created {new Date(market.createdAt).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}
                </div>
            </div>
        </main>
    );
}

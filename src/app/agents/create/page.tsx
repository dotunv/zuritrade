"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import type { StrategyType, RiskLevel, MarketRegion, MarketCategory } from "../../../types";

const REGIONS: { value: MarketRegion; label: string }[] = [
    { value: "nigeria", label: "🇳🇬 Nigeria" },
    { value: "south-africa", label: "🇿🇦 South Africa" },
    { value: "kenya", label: "🇰🇪 Kenya" },
    { value: "ghana", label: "🇬🇭 Ghana" },
    { value: "ethiopia", label: "🇪🇹 Ethiopia" },
    { value: "pan-african", label: "🌍 Pan-African" },
];

const CATEGORIES: { value: MarketCategory; label: string }[] = [
    { value: "elections", label: "Elections" },
    { value: "policy", label: "Policy" },
    { value: "economics", label: "Economics" },
    { value: "diplomacy", label: "Diplomacy" },
];

const STRATEGIES: { value: StrategyType; label: string; desc: string }[] = [
    { value: "momentum", label: "Momentum", desc: "Follow the trend. Buy when probability is rising, sell when declining." },
    { value: "contrarian", label: "Contrarian", desc: "Bet against the crowd. Buy undervalued positions, sell overvalued." },
    { value: "balanced", label: "Balanced", desc: "Mix of momentum and contrarian signals with moderate position sizing." },
];

const RISK_LABELS: Record<string, string> = {
    "0": "Conservative",
    "1": "Moderate",
    "2": "Aggressive",
};
const RISK_VALUES: RiskLevel[] = ["conservative", "moderate", "aggressive"];

export default function CreateAgentPage() {
    const { isConnected, connect, isConnecting } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [deploying, setDeploying] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [strategy, setStrategy] = useState<StrategyType>("momentum");
    const [riskIdx, setRiskIdx] = useState(1);
    const [selectedRegions, setSelectedRegions] = useState<MarketRegion[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<MarketCategory[]>([]);
    const [capital, setCapital] = useState(1000);
    const [maxTrade, setMaxTrade] = useState(200);
    const [dailyLoss, setDailyLoss] = useState(100);
    const [posLimit, setPosLimit] = useState(5);

    if (!isConnected) {
        return (
            <main className="min-h-[70vh] flex items-center justify-center">
                <div className="text-center max-w-md">
                    <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet First</h2>
                    <p className="text-muted text-sm mb-6">You need to connect your wallet before creating an agent.</p>
                    <button onClick={connect} disabled={isConnecting} className="bg-accent text-[#0a0a0a] px-6 py-3 rounded-lg font-bold text-sm cursor-pointer border-0 hover:bg-accent-hover transition-colors disabled:opacity-50">
                        {isConnecting ? "Connecting..." : "Connect Wallet"}
                    </button>
                </div>
            </main>
        );
    }

    const toggleRegion = (r: MarketRegion) =>
        setSelectedRegions((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);
    const toggleCategory = (c: MarketCategory) =>
        setSelectedCategories((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

    const canProceed = () => {
        if (step === 0) return name.trim().length > 0;
        if (step === 1) return selectedRegions.length > 0 && selectedCategories.length > 0;
        return true;
    };

    const handleDeploy = async () => {
        setDeploying(true);
        await new Promise((r) => setTimeout(r, 2500));
        router.push("/dashboard");
    };

    const STEPS_CONFIG = ["Profile", "Markets", "Strategy", "Limits", "Review"];

    return (
        <main className="max-w-[700px] mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-white mb-2">Create Agent</h1>
            <p className="text-muted text-sm mb-8">Configure your autonomous trading agent in a few steps.</p>

            {/* Step indicator */}
            <div className="flex items-center gap-1 mb-8">
                {STEPS_CONFIG.map((s, i) => (
                    <React.Fragment key={s}>
                        <button
                            onClick={() => i < step && setStep(i)}
                            className={`flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase px-2 py-1 rounded cursor-pointer border-0 transition-colors ${i === step ? "bg-accent/10 text-accent" : i < step ? "bg-surface text-muted hover:text-white" : "bg-transparent text-muted/50"
                                }`}
                        >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i < step ? "bg-accent text-[#0a0a0a]" : i === step ? "border border-accent text-accent" : "border border-border text-muted/50"
                                }`}>
                                {i < step ? "✓" : i + 1}
                            </span>
                            <span className="hidden sm:inline">{s}</span>
                        </button>
                        {i < STEPS_CONFIG.length - 1 && (
                            <div className={`flex-1 h-px max-w-[30px] ${i < step ? "bg-accent" : "bg-border"}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div className="border border-border rounded-xl bg-surface p-6">
                {/* Step 0: Profile */}
                {step === 0 && (
                    <div>
                        <h2 className="text-lg font-bold text-white mb-1">Agent Profile</h2>
                        <p className="text-muted text-sm mb-6">Give your agent a name. It will get its own ERC-8004 smart wallet.</p>
                        <label className="block text-xs text-muted font-mono tracking-widest uppercase mb-2">Agent Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Lagos Oracle"
                            className="w-full bg-[#0a0a0a] border border-border rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/40 transition-colors placeholder:text-muted/40"
                        />
                        <p className="text-xs text-muted mt-2">Choose wisely — this is how your agent appears in the dashboard.</p>
                    </div>
                )}

                {/* Step 1: Markets */}
                {step === 1 && (
                    <div>
                        <h2 className="text-lg font-bold text-white mb-1">Market Focus</h2>
                        <p className="text-muted text-sm mb-6">Select which regions and categories your agent should trade in.</p>

                        <label className="block text-xs text-muted font-mono tracking-widest uppercase mb-3">Regions</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                            {REGIONS.map((r) => (
                                <button
                                    key={r.value}
                                    onClick={() => toggleRegion(r.value)}
                                    className={`text-sm px-3 py-2.5 rounded-lg border transition-colors cursor-pointer text-left ${selectedRegions.includes(r.value)
                                            ? "border-accent bg-accent/10 text-white"
                                            : "border-border bg-[#0a0a0a] text-muted hover:border-border hover:text-white"
                                        }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>

                        <label className="block text-xs text-muted font-mono tracking-widest uppercase mb-3">Categories</label>
                        <div className="grid grid-cols-2 gap-2">
                            {CATEGORIES.map((c) => (
                                <button
                                    key={c.value}
                                    onClick={() => toggleCategory(c.value)}
                                    className={`text-sm px-3 py-2.5 rounded-lg border transition-colors cursor-pointer text-left ${selectedCategories.includes(c.value)
                                            ? "border-accent bg-accent/10 text-white"
                                            : "border-border bg-[#0a0a0a] text-muted hover:border-border hover:text-white"
                                        }`}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Strategy */}
                {step === 2 && (
                    <div>
                        <h2 className="text-lg font-bold text-white mb-1">Trading Strategy</h2>
                        <p className="text-muted text-sm mb-6">Choose how your agent approaches the markets.</p>

                        <label className="block text-xs text-muted font-mono tracking-widest uppercase mb-3">Strategy Type</label>
                        <div className="space-y-2 mb-8">
                            {STRATEGIES.map((s) => (
                                <button
                                    key={s.value}
                                    onClick={() => setStrategy(s.value)}
                                    className={`w-full text-left p-4 rounded-lg border transition-colors cursor-pointer ${strategy === s.value
                                            ? "border-accent bg-accent/10"
                                            : "border-border bg-[#0a0a0a] hover:border-border"
                                        }`}
                                >
                                    <span className="text-sm font-bold text-white block mb-1">{s.label}</span>
                                    <span className="text-xs text-muted">{s.desc}</span>
                                </button>
                            ))}
                        </div>

                        <label className="block text-xs text-muted font-mono tracking-widest uppercase mb-3">
                            Risk Level — <span className="text-accent">{RISK_LABELS[String(riskIdx)]}</span>
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={2}
                            value={riskIdx}
                            onChange={(e) => setRiskIdx(Number(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-[10px] text-muted font-mono mt-1">
                            <span>Conservative</span>
                            <span>Moderate</span>
                            <span>Aggressive</span>
                        </div>
                    </div>
                )}

                {/* Step 3: Limits */}
                {step === 3 && (
                    <div>
                        <h2 className="text-lg font-bold text-white mb-1">Risk Limits</h2>
                        <p className="text-muted text-sm mb-6">Set guardrails for your agent. These are enforced on-chain.</p>

                        <div className="space-y-5">
                            {[
                                { label: "Capital Allocation (USDC)", value: capital, set: setCapital, min: 100, max: 50000, step: 100 },
                                { label: "Max Trade Size (USDC)", value: maxTrade, set: setMaxTrade, min: 10, max: 5000, step: 10 },
                                { label: "Daily Loss Limit (USDC)", value: dailyLoss, set: setDailyLoss, min: 10, max: 5000, step: 10 },
                                { label: "Max Open Positions", value: posLimit, set: setPosLimit, min: 1, max: 20, step: 1 },
                            ].map((field) => (
                                <div key={field.label}>
                                    <label className="flex items-center justify-between text-xs text-muted font-mono tracking-widest uppercase mb-2">
                                        <span>{field.label}</span>
                                        <span className="text-accent">{field.label.includes("Position") ? field.value : `$${field.value.toLocaleString()}`}</span>
                                    </label>
                                    <input
                                        type="range"
                                        min={field.min}
                                        max={field.max}
                                        step={field.step}
                                        value={field.value}
                                        onChange={(e) => field.set(Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                    <div>
                        <h2 className="text-lg font-bold text-white mb-1">Review & Deploy</h2>
                        <p className="text-muted text-sm mb-6">Confirm your agent configuration before deploying on-chain.</p>

                        <div className="space-y-4">
                            {[
                                { label: "Name", value: name },
                                { label: "Strategy", value: strategy },
                                { label: "Risk Level", value: RISK_VALUES[riskIdx] },
                                { label: "Regions", value: selectedRegions.join(", ") || "None" },
                                { label: "Categories", value: selectedCategories.join(", ") || "None" },
                                { label: "Capital", value: `$${capital.toLocaleString()} USDC` },
                                { label: "Max Trade", value: `$${maxTrade.toLocaleString()} USDC` },
                                { label: "Daily Loss Limit", value: `$${dailyLoss.toLocaleString()} USDC` },
                                { label: "Position Limit", value: String(posLimit) },
                            ].map((row) => (
                                <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                    <span className="text-xs text-muted font-mono tracking-widest uppercase">{row.label}</span>
                                    <span className="text-sm text-white font-medium">{row.value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 p-4 rounded-lg bg-accent/5 border border-accent/20">
                            <p className="text-xs text-accent font-mono">
                                ⚡ Deploying will create an ERC-8004 smart wallet on Base and allocate ${capital.toLocaleString()} USDC to the agent.
                            </p>
                        </div>
                    </div>
                )}

                {/* Navigation buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                    {step > 0 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="text-sm text-muted hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
                        >
                            ← Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 4 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceed()}
                            className="inline-flex items-center gap-2 bg-accent text-[#0a0a0a] px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-30 cursor-pointer border-0"
                        >
                            Continue
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </button>
                    ) : (
                        <button
                            onClick={handleDeploy}
                            disabled={deploying}
                            className="inline-flex items-center gap-2 bg-accent text-[#0a0a0a] px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer border-0"
                        >
                            {deploying ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" /></svg>
                                    Deploying Agent...
                                </>
                            ) : (
                                <>
                                    Deploy Agent
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}

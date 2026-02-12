export default function LearnPage() {
  return (
    <main className="max-w-[800px] mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2 text-white">Documentation</h1>
      <p className="text-muted mb-6">Learn how ZuriTrade&apos;s autonomous agents work.</p>

      <div className="space-y-6 text-white">
        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-2 text-white">What is ZuriTrade?</h2>
          <p className="text-muted text-sm leading-relaxed">
            ZuriTrade lets you deploy autonomous trading agents on African political prediction markets.
            Each agent gets its own ERC-8004 smart wallet on Base, follows your rules, and trades 24/7.
          </p>
        </section>
        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-2 text-white">How Agents Work</h2>
          <p className="text-muted text-sm leading-relaxed">
            Every few minutes, your agent monitors political signals, evaluates its strategy, checks risk constraints,
            and decides whether to buy, sell, or hold. All trades are signed and executed on-chain automatically.
          </p>
        </section>
        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-2 text-white">ERC-8004 Wallets</h2>
          <p className="text-muted text-sm leading-relaxed">
            Each agent has a permissioned smart wallet that holds funds, executes trades, and enforces constraints
            like max trade size, daily loss limits, and position limits — all on-chain.
          </p>
        </section>
        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-2 text-white">Prediction Markets</h2>
          <p className="text-muted text-sm leading-relaxed">
            Markets cover African political events — elections, policy decisions, economic indicators, and diplomacy.
            Prices reflect collective probability assessments. Markets resolve based on real-world outcomes.
          </p>
        </section>
      </div>
    </main>
  );
}

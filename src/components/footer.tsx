import React from "react";
import Link from "next/link";

const COLUMNS = [
  {
    heading: "ZURITRADE",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Create Agent", href: "/agents/create" },
      { label: "Documentation", href: "/learn" },
    ],
  },
  {
    heading: "CONNECT",
    links: [
      { label: "Twitter", href: "https://x.com" },
      { label: "Discord", href: "#" },
      { label: "GitHub", href: "#" },
    ],
  },
  {
    heading: "MARKETS",
    links: [
      { label: "Nigeria", href: "#" },
      { label: "South Africa", href: "#" },
      { label: "Kenya", href: "#" },
      { label: "Pan-African", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] relative overflow-hidden">
      {/* Accent line at top */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="max-w-[1200px] mx-auto px-6 py-16">
        {/* Schematic grid */}
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 md:gap-16">
          {/* Logo column — left side with connecting line */}
          <div className="flex flex-col items-start">
            <Link href="/" className="inline-flex items-center gap-2 no-underline mb-6" aria-label="ZuriTrade home">
              <div className="w-10 h-10 border border-accent/40 rounded flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
            </Link>
            {/* Vertical connector line */}
            <div className="hidden md:block w-px bg-accent/20 flex-1 ml-5" aria-hidden="true" />
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                {/* Column heading box */}
                <div className="inline-flex items-center border border-accent/30 rounded px-3 py-1.5 mb-4">
                  <span className="text-[10px] font-mono font-bold tracking-[0.15em] uppercase text-accent">
                    {col.heading}
                  </span>
                </div>

                {/* Connector + links */}
                <div className="flex flex-col gap-0">
                  {col.links.map((link, i) => (
                    <div key={link.label} className="flex items-center gap-0">
                      {/* Horizontal connector line */}
                      <div className="w-4 h-px bg-accent/15 flex-shrink-0" aria-hidden="true" />
                      {/* Vertical segment from connector */}
                      {i < col.links.length - 1 && (
                        <div
                          className="absolute w-px bg-accent/15"
                          style={{ height: "100%" }}
                          aria-hidden="true"
                        />
                      )}
                      {/* Link box */}
                      {link.href.startsWith("http") ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center border border-[#1a1a1a] rounded px-3 py-1.5 my-1 no-underline text-[#666] hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-colors"
                        >
                          <span className="text-[10px] font-mono tracking-[0.12em] uppercase">
                            {link.label}
                          </span>
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="inline-flex items-center border border-[#1a1a1a] rounded px-3 py-1.5 my-1 no-underline text-[#666] hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-colors"
                        >
                          <span className="text-[10px] font-mono tracking-[0.12em] uppercase">
                            {link.label}
                          </span>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-6 border-t border-[#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-[#333]">
            Autonomous Political Trading Agents
          </span>
          <div className="flex items-center gap-1" aria-hidden="true">
            <span className="w-1.5 h-1.5 rounded-sm bg-accent/40" />
            <div className="w-20 h-px bg-accent/15" />
            <span className="w-1.5 h-1.5 rounded-sm bg-accent/40" />
          </div>
          <span className="text-[10px] font-mono tracking-[0.12em] uppercase text-[#333]">
            © {new Date().getFullYear()} ZuriTrade
          </span>
        </div>
      </div>
    </footer>
  );
}
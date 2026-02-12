"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../lib/AuthContext";

const NAV_LINKS = [
    { label: "Dashboard", href: "/dashboard", color: "#10b981" },
    { label: "Markets", href: "#", color: "#a78bfa" },
    { label: "Agents", href: "/agents/create", color: "#f59e0b" },
    { label: "Docs", href: "/learn", color: "#38bdf8" },
];

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const { isConnected, isConnecting, user, connect, disconnect } = useAuth();

    return (
        <nav className="sticky top-0 z-40 flex justify-center py-3 px-4" aria-label="Main navigation">
            {/* Floating modular navbar */}
            <div className="inline-flex items-stretch bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden max-w-full">
                {/* Logo segment */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2.5 border-r border-[#1a1a1a] no-underline text-white hover:bg-[#111] transition-colors"
                    aria-label="ZuriTrade home"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                </Link>

                {/* Desktop nav links */}
                <div className="hidden md:flex items-stretch">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="inline-flex items-center gap-2 px-4 py-2.5 border-r border-[#1a1a1a] no-underline text-[#888] hover:text-white hover:bg-[#111] transition-colors group"
                        >
                            <span
                                className="w-2 h-2 rounded-sm flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                                style={{ backgroundColor: link.color }}
                                aria-hidden="true"
                            />
                            <span className="text-[11px] font-mono font-medium tracking-[0.12em] uppercase whitespace-nowrap">
                                {link.label}
                            </span>
                        </Link>
                    ))}
                </div>

                {/* Right-side CTA / Auth */}
                <div className="hidden md:flex items-stretch">
                    {isConnected ? (
                        <>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 px-4 py-2.5 border-r border-[#1a1a1a] no-underline text-[#888] hover:text-white hover:bg-[#111] transition-colors"
                            >
                                <span className="w-2 h-2 rounded-full bg-success flex-shrink-0 animate-pulse" aria-hidden="true" />
                                <span className="text-[11px] font-mono tracking-[0.12em] uppercase">
                                    {user?.displayName}
                                </span>
                            </Link>
                            <button
                                onClick={disconnect}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-transparent border-0 text-[#555] hover:text-danger hover:bg-danger/5 transition-colors cursor-pointer"
                            >
                                <span className="text-[11px] font-mono tracking-[0.12em] uppercase">
                                    Disconnect
                                </span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={connect}
                            disabled={isConnecting}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent border-0 text-[#0a0a0a] cursor-pointer hover:bg-accent-hover transition-colors disabled:opacity-50"
                        >
                            {isConnecting ? (
                                <span className="text-[11px] font-mono font-bold tracking-[0.12em] uppercase">
                                    Connecting...
                                </span>
                            ) : (
                                <>
                                    <span className="text-[11px] font-mono font-bold tracking-[0.12em] uppercase">
                                        Connect Wallet
                                    </span>
                                    <span className="text-sm font-mono" aria-hidden="true">›</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Mobile menu button */}
                <button
                    className="md:hidden inline-flex items-center justify-center w-11 bg-transparent border-0 border-l border-[#1a1a1a] cursor-pointer"
                    aria-label={open ? "Close menu" : "Open menu"}
                    onClick={() => setOpen((s) => !s)}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        {open ? (
                            <path d="M6 6L18 18M6 18L18 6" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                        ) : (
                            <path d="M3 7H21M3 12H21M3 17H21" stroke="#888" strokeWidth="2" strokeLinecap="round" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile dropdown */}
            {open && (
                <div className="fixed top-[52px] left-0 right-0 z-50 md:hidden">
                    <div className="mx-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden mt-1">
                        <ul className="list-none m-0 p-0">
                            {NAV_LINKS.map((link) => (
                                <li key={link.label} className="border-b border-[#1a1a1a] last:border-0">
                                    <Link
                                        href={link.href}
                                        onClick={() => setOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-white no-underline hover:bg-[#111] transition-colors"
                                    >
                                        <span
                                            className="w-2 h-2 rounded-sm flex-shrink-0"
                                            style={{ backgroundColor: link.color }}
                                            aria-hidden="true"
                                        />
                                        <span className="text-[11px] font-mono font-medium tracking-[0.12em] uppercase">
                                            {link.label}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <div className="p-3 border-t border-[#1a1a1a]">
                            {isConnected ? (
                                <button
                                    onClick={() => { disconnect(); setOpen(false); }}
                                    className="w-full py-2.5 rounded bg-[#111] text-[#888] text-[11px] font-mono tracking-[0.12em] uppercase cursor-pointer border border-[#1a1a1a]"
                                >
                                    Disconnect ({user?.walletAddress})
                                </button>
                            ) : (
                                <button
                                    onClick={() => { connect(); setOpen(false); }}
                                    disabled={isConnecting}
                                    className="w-full py-2.5 rounded bg-accent text-[#0a0a0a] text-[11px] font-mono font-bold tracking-[0.12em] uppercase cursor-pointer border-0"
                                >
                                    {isConnecting ? "Connecting..." : "Connect Wallet  ›"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

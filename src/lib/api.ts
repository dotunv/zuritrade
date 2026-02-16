/**
 * API client for Zuritrade backend.
 * All routes are relative to the app origin.
 */

const BASE = "";

async function fetchApi<T>(
    path: string,
    options?: RequestInit
): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error((err as { message?: string }).message ?? "API error");
    }
    return res.json() as Promise<T>;
}

// ─── Agents ───
export interface CreateAgentBody {
    name: string;
    strategyType: string;
    riskLevel: string;
    regions: string[];
    categories: string[];
    maxTradeSize: number;
    dailyLossLimit: number;
    positionLimit: number;
    capitalAllocated: number;
    /** ERC-8004 agentId from IdentityRegistry.register() */
    onChainAgentId?: bigint | string;
}

export async function createAgent(
    body: CreateAgentBody,
    walletAddress: string
): Promise<{ id: string }> {
    const payload = {
        ...body,
        walletAddress,
        onChainAgentId: body.onChainAgentId != null ? String(body.onChainAgentId) : undefined,
    };
    return fetchApi("/api/agents", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function getAgents(walletAddress: string) {
    return fetchApi<{ agents: unknown[] }>(
        `/api/agents?walletAddress=${encodeURIComponent(walletAddress)}`
    );
}

export async function getAgent(id: string): Promise<{ agent: unknown } | null> {
    const res = await fetch(`${BASE}/api/agents/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error((err as { message?: string }).message ?? "API error");
    }
    return res.json() as Promise<{ agent: unknown }>;
}

export async function getAgentTrades(agentId: string) {
    return fetchApi<{ trades: unknown[] }>(`/api/agents/${agentId}/trades`);
}

export async function getAgentPositions(agentId: string) {
    return fetchApi<{ positions: unknown[] }>(
        `/api/agents/${agentId}/positions`
    );
}

// ─── Markets ───
export async function getMarkets() {
    return fetchApi<{ markets: unknown[] }>("/api/markets");
}

export async function getMarket(id: string): Promise<{ market: unknown } | null> {
    const res = await fetch(`${BASE}/api/markets/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error((err as { message?: string }).message ?? "API error");
    }
    return res.json() as Promise<{ market: unknown }>;
}

// ─── Portfolio ───
export async function getPortfolioTrades(walletAddress: string) {
    return fetchApi<{ trades: unknown[] }>(
        `/api/portfolio/trades?walletAddress=${encodeURIComponent(walletAddress)}`
    );
}

export async function getPortfolioStats(walletAddress: string) {
    return fetchApi<{
        totalCapital: number;
        totalPnl: number;
        totalPnlPercent: number;
        activeAgents: number;
        totalAgents: number;
        totalTrades: number;
        avgWinRate: number;
    }>(
        `/api/portfolio/stats?walletAddress=${encodeURIComponent(walletAddress)}`
    );
}

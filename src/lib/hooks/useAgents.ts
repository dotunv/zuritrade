"use client";

import { useQuery } from "@tanstack/react-query";
import { getAgents } from "../api";
import type { Agent } from "../../types";

function mapAgent(a: Record<string, unknown>): Agent {
    const mf = (a.marketFocus as { regions?: string[]; categories?: string[] }) ?? {};
    return {
        id: a.id as string,
        userId: a.userId as string,
        name: a.name as string,
        walletAddress: a.walletAddress as string,
        strategyType: a.strategyType as Agent["strategyType"],
        riskLevel: a.riskLevel as Agent["riskLevel"],
        marketFocus: {
            regions: mf.regions ?? [],
            categories: mf.categories ?? [],
        },
        maxTradeSize: a.maxTradeSize as number,
        dailyLossLimit: a.dailyLossLimit as number,
        positionLimit: a.positionLimit as number,
        capitalAllocated: a.capitalAllocated as number,
        capitalUsed: a.capitalUsed as number,
        status: a.status as Agent["status"],
        pnl: a.pnl as number,
        pnlPercent: a.pnlPercent as number,
        winRate: a.winRate as number,
        totalTrades: a.totalTrades as number,
        openPositions: a.openPositions as number,
        lastTradeAt: a.lastTradeAt ? new Date(a.lastTradeAt as string).toISOString() : null,
        deployedAt: new Date(a.deployedAt as string).toISOString(),
        createdAt: new Date(a.createdAt as string).toISOString(),
    };
}

export function useAgents(walletAddress: string | undefined) {
    return useQuery({
        queryKey: ["agents", walletAddress],
        queryFn: async () => {
            if (!walletAddress) return { agents: [] };
            const res = await getAgents(walletAddress);
            return {
                agents: (res.agents as Record<string, unknown>[]).map(mapAgent),
            };
        },
        enabled: !!walletAddress,
    });
}

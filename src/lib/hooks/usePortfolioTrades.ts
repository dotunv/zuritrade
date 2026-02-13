"use client";

import { useQuery } from "@tanstack/react-query";
import { getPortfolioTrades } from "../api";
import type { Trade } from "../../types";

function mapTrade(t: Record<string, unknown>): Trade {
    return {
        id: t.id as string,
        agentId: t.agentId as string,
        agentName: t.agentName as string,
        marketId: t.marketId as string,
        marketTitle: t.marketTitle as string,
        direction: t.direction as Trade["direction"],
        amount: t.amount as number,
        price: t.price as number,
        txHash: t.txHash as string,
        status: t.status as Trade["status"],
        pnl: t.pnl as number | null,
        gasUsed: t.gasUsed as string,
        blockNumber: t.blockNumber as number,
        timestamp: new Date(t.timestamp as string).toISOString(),
    };
}

export function usePortfolioTrades(walletAddress: string | undefined) {
    return useQuery({
        queryKey: ["portfolio", "trades", walletAddress],
        queryFn: async () => {
            if (!walletAddress) return { trades: [] };
            const res = await getPortfolioTrades(walletAddress);
            return {
                trades: (res.trades as Record<string, unknown>[]).map(mapTrade),
            };
        },
        enabled: !!walletAddress,
    });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { getAgentPositions } from "../api";
import type { Position } from "../../types";

function mapPosition(p: Record<string, unknown>): Position {
    return {
        id: p.id as string,
        agentId: p.agentId as string,
        marketId: p.marketId as string,
        marketTitle: p.marketTitle as string,
        direction: p.direction as Position["direction"],
        entryPrice: p.entryPrice as number,
        currentPrice: p.currentPrice as number,
        amount: p.amount as number,
        unrealizedPnl: p.unrealizedPnl as number,
        unrealizedPnlPercent: p.unrealizedPnlPercent as number,
        status: p.status as Position["status"],
        openedAt: new Date(p.openedAt as string).toISOString(),
        closedAt: p.closedAt ? new Date(p.closedAt as string).toISOString() : null,
    };
}

export function usePositions(agentId: string | undefined) {
    return useQuery({
        queryKey: ["positions", agentId],
        queryFn: async () => {
            if (!agentId) return { positions: [] };
            const res = await getAgentPositions(agentId);
            return {
                positions: (res.positions as Record<string, unknown>[]).map(mapPosition),
            };
        },
        enabled: !!agentId,
    });
}

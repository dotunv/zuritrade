"use client";

import { useQuery } from "@tanstack/react-query";
import { getMarkets } from "../api";
import type { PoliticalMarket } from "../../types";

function mapMarket(m: Record<string, unknown>): PoliticalMarket {
    return {
        id: m.id as string,
        title: m.title as string,
        description: m.description as string,
        category: m.category as PoliticalMarket["category"],
        region: m.region as PoliticalMarket["region"],
        probability: m.probability as number,
        volume: m.volume as number,
        totalTraders: m.totalTraders as number,
        status: m.status as PoliticalMarket["status"],
        resolution: m.resolution as string | null,
        endDate: new Date(m.endDate as string).toISOString(),
        createdAt: new Date(m.createdAt as string).toISOString(),
    };
}

export function useMarkets() {
    return useQuery({
        queryKey: ["markets"],
        queryFn: async () => {
            const res = await getMarkets();
            return {
                markets: (res.markets as Record<string, unknown>[]).map(mapMarket),
            };
        },
    });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { getMarket } from "../api";
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

export function useMarket(id: string | undefined) {
    return useQuery({
        queryKey: ["market", id],
        queryFn: async () => {
            if (!id) return null;
            const res = await getMarket(id);
            if (!res) return null;
            return mapMarket(res.market as Record<string, unknown>);
        },
        enabled: !!id,
    });
}

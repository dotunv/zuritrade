"use client";

import { useQuery } from "@tanstack/react-query";
import { getPortfolioStats } from "../api";

export function usePortfolioStats(walletAddress: string | undefined) {
    return useQuery({
        queryKey: ["portfolio", "stats", walletAddress],
        queryFn: () => getPortfolioStats(walletAddress!),
        enabled: !!walletAddress,
    });
}

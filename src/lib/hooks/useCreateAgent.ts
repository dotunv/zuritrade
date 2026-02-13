"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAgent, type CreateAgentBody } from "../api";

export function useCreateAgent(walletAddress: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: CreateAgentBody) => {
            if (!walletAddress) throw new Error("Wallet not connected");
            return createAgent(body, walletAddress);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agents", walletAddress] });
            queryClient.invalidateQueries({ queryKey: ["portfolio"] });
        },
    });
}

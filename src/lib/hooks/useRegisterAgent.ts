"use client";

import { useCallback } from "react";
import { useChainId, usePublicClient, useWriteContract } from "wagmi";
import { parseEventLogs } from "viem";
import {
  IDENTITY_REGISTRY_ABI,
  IDENTITY_REGISTRY_ADDRESS,
} from "../contracts";

/** Placeholder agent URI (ERC-8004 registration file). Can be updated via setAgentURI later. */
const DEFAULT_AGENT_URI = "https://zuritrade.app/agent";

export function useRegisterAgent() {
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const { writeContractAsync } = useWriteContract();

  const register = useCallback(async (): Promise<bigint> => {
    const address = IDENTITY_REGISTRY_ADDRESS[chainId as keyof typeof IDENTITY_REGISTRY_ADDRESS];
    if (!address) {
      throw new Error(`ERC-8004 IdentityRegistry not deployed on chain ${chainId}. Use Base or Base Sepolia.`);
    }

    const hash = await writeContractAsync({
      abi: IDENTITY_REGISTRY_ABI,
      address,
      functionName: "register",
      args: [DEFAULT_AGENT_URI],
    });

    if (!publicClient) {
      throw new Error("Public client not available");
    }

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const logs = parseEventLogs({
      abi: IDENTITY_REGISTRY_ABI,
      logs: receipt.logs,
    });
    const registered = logs.find((l) => l.eventName === "Registered");
    if (!registered || !("agentId" in registered.args)) {
      throw new Error("Could not parse agentId from Registered event");
    }
    return registered.args.agentId as bigint;
  }, [chainId, publicClient, writeContractAsync]);

  return { register };
}

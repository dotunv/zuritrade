/**
 * ERC-8004 Identity Registry addresses (official deployments).
 * @see https://github.com/erc-8004/erc-8004-contracts
 */

export const IDENTITY_REGISTRY_ADDRESS = {
  // Base Mainnet
  8453: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as const,
  // Base Sepolia (testnet)
  84532: "0x8004A818BFB912233c491871b3d84c89A494BD9e" as const,
} as const;

/** Minimal ABI for register() and getAgentWallet() */
export const IDENTITY_REGISTRY_ABI = [
  {
    inputs: [{ name: "agentURI", type: "string" }],
    name: "register",
    outputs: [{ name: "agentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "agentId", type: "uint256" }],
    name: "getAgentWallet",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "agentId", type: "uint256" },
      { indexed: false, name: "agentURI", type: "string" },
      { indexed: true, name: "owner", type: "address" },
    ],
    name: "Registered",
    type: "event",
  },
] as const;

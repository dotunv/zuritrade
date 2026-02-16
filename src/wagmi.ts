import { createConfig, http } from "wagmi";
import type { Chain } from "viem";
import { base, baseSepolia, mainnet, sepolia } from "wagmi/chains";

const chains: readonly [Chain, ...Chain[]] =
  process.env.NEXT_PUBLIC_ENABLE_TESTNETS === "true"
    ? [base, baseSepolia, mainnet, sepolia]
    : [base, mainnet];

export const config = createConfig({
  chains,
  transports: Object.fromEntries(
    chains.map((chain) => [chain.id, http()])
  ),
  ssr: true,
});

import {
    type Web3AuthContextConfig,
    WEB3AUTH_NETWORK,
    type Web3AuthOptions,
} from "@web3auth/modal";

const clientId =
    process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID ||
    "PLACEHOLDER_GET_FROM_DASHBOARD";

const web3AuthOptions: Web3AuthOptions = {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
};

export const web3AuthContextConfig: Web3AuthContextConfig = {
    web3AuthOptions,
};

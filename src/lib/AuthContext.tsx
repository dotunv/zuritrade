"use client";

import React, {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useState,
    ReactNode,
} from "react";
import {
    useWeb3Auth,
    useWeb3AuthConnect,
    useWeb3AuthDisconnect,
    useWeb3AuthUser,
} from "@web3auth/modal/react";
import { getAddress } from "viem";
import type { User } from "../types";

interface AuthState {
    user: User | null;
    isConnected: boolean;
    isConnecting: boolean;
}

interface AuthContextValue extends AuthState {
    connect: () => Promise<void>;
    disconnect: () => void;
    /** Full wallet address for API calls (e.g. createAgent, getAgents) */
    walletAddressFull: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function buildUserFromWeb3Auth(
    fullAddress: string,
    userInfo: { email?: string; name?: string; profileImage?: string } | null
): { user: User; fullAddress: string } {
    const shortAddress =
        fullAddress.slice(0, 6) + "..." + fullAddress.slice(-4);
    return {
        fullAddress,
        user: {
            id: `web3auth_${fullAddress.toLowerCase().slice(0, 16)}`,
            email: userInfo?.email ?? "",
            walletAddress: shortAddress,
            displayName: userInfo?.name ?? shortAddress,
            avatarUrl: userInfo?.profileImage,
            createdAt: new Date().toISOString(),
        },
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const { provider, isConnected: web3Connected } = useWeb3Auth();
    const { connect: web3Connect, loading: connectLoading } =
        useWeb3AuthConnect();
    const { disconnect: web3Disconnect } = useWeb3AuthDisconnect();
    const { getUserInfo } = useWeb3AuthUser();

    const [user, setUser] = useState<User | null>(null);
    const [walletAddressFull, setWalletAddressFull] = useState<string | null>(null);

    const connect = useCallback(async () => {
        const provider = await web3Connect();
        if (provider) {
            const accounts = (await provider.request({
                method: "eth_accounts",
            })) as string[] | undefined;
            const address = accounts?.[0];
            if (address) {
                const userInfo = await getUserInfo();
                const fullAddress = getAddress(address);
                const { user: u } = buildUserFromWeb3Auth(
                    fullAddress,
                    userInfo ?? undefined
                );
                setUser(u);
                setWalletAddressFull(fullAddress);
            }
        }
    }, [web3Connect, getUserInfo]);

    const disconnect = useCallback(async () => {
        await web3Disconnect();
        setUser(null);
        setWalletAddressFull(null);
    }, [web3Disconnect]);

    useEffect(() => {
        if (!web3Connected || !provider) {
            setUser(null);
            setWalletAddressFull(null);
            return;
        }

        let cancelled = false;

        async function loadUser() {
            try {
                const accounts = (await provider.request({
                    method: "eth_accounts",
                })) as string[] | undefined;
                const address = accounts?.[0];
                if (cancelled || !address) return;

                const userInfo = await getUserInfo();
                const fullAddress = getAddress(address);
                const { user: u } = buildUserFromWeb3Auth(
                    fullAddress,
                    userInfo ?? undefined
                );
                setUser(u);
                setWalletAddressFull(fullAddress);
            } catch {
                if (!cancelled) {
                    setUser(null);
                    setWalletAddressFull(null);
                }
            }
        }

        loadUser();
        return () => {
            cancelled = true;
        };
    }, [web3Connected, provider, getUserInfo]);

    const value: AuthContextValue = {
        user,
        isConnected: web3Connected,
        isConnecting: connectLoading,
        connect,
        disconnect,
        walletAddressFull,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

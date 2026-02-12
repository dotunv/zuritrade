"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { User } from "../types";
import { mockUser } from "./mockData";

interface AuthState {
    user: User | null;
    isConnected: boolean;
    isConnecting: boolean;
}

interface AuthContextValue extends AuthState {
    connect: () => Promise<void>;
    disconnect: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isConnected: false,
        isConnecting: false,
    });

    const connect = useCallback(async () => {
        setState((s) => ({ ...s, isConnecting: true }));
        // Simulate Web3Auth connection delay
        await new Promise((r) => setTimeout(r, 1200));
        setState({
            user: mockUser,
            isConnected: true,
            isConnecting: false,
        });
    }, []);

    const disconnect = useCallback(() => {
        setState({ user: null, isConnected: false, isConnecting: false });
    }, []);

    return (
        <AuthContext.Provider value={{ ...state, connect, disconnect }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

"use client";

import '@rainbow-me/rainbowkit/styles.css';
import { ReactNode, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Web3AuthProvider } from '@web3auth/modal/react';
import { config } from '../wagmi';
import { web3AuthContextConfig } from '../lib/web3authContext';
import { AuthProvider } from '../lib/AuthContext';

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Web3AuthProvider config={web3AuthContextConfig}>
          <RainbowKitProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </RainbowKitProvider>
        </Web3AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

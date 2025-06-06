'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultWallets,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import {
  phantomWallet,
  trustWallet,
  ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, http, createConfig } from 'wagmi';
import { Provider as JotaiProvider } from 'jotai';
import Header from '@/components/header';
import { paseoAssetHub } from '@/lib/chains';

export const localConfig = createConfig({
  chains: [
    paseoAssetHub,
  ],
  transports: {
    [paseoAssetHub.id]: http(),
  },
  ssr: true,
});

const { wallets } = getDefaultWallets();
// initialize and destructure wallets object

const config = getDefaultConfig({
  appName: "OpenGuild DaNang Hackcamp 2025",
  projectId: "ddf8cf3ee0013535c3760d4c79c9c8b9",
  wallets: [
    ...wallets,
    {
      groupName: 'Other',
      wallets: [phantomWallet, trustWallet, ledgerWallet],
    },
  ],
  chains: [
    paseoAssetHub,
  ],
  transports: {
    [paseoAssetHub.id]: http(),
  },
  ssr: true, // Because it is Nextjs's App router, you need to declare ssr as true
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <Header />
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </JotaiProvider>
  );
}

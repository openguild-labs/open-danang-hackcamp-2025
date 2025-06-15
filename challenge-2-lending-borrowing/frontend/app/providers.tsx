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
import {
  manta,
  moonbaseAlpha,
  moonbeam,
} from 'wagmi/chains';
import { defineChain } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, http, createConfig } from 'wagmi';
import { Provider as JotaiProvider } from 'jotai';

export const paseoAssetHub = defineChain({
  id: 420420422,
  name: 'Paseo AssetHub',
  nativeCurrency: {
    decimals: 18,
    name: 'Paseo',
    symbol: 'PAS',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-passet-hub-eth-rpc.polkadot.io/'],
      webSocket: ['wss://testnet-passet-hub.polkadot.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Explorer',
      url: 'https://blockscout-passet-hub.parity-testnet.parity.io/',
    },
  },
  contracts: {
    multicall3: {
      address: '0x5545dec97cb957e83d3e6a1e82fabfacf9764cf1',
      blockCreated: 10174702,
    },
  },
});

// Local Wagmi config for Sigpass wallet flows
export const localConfig = createConfig({
  chains: [paseoAssetHub, manta, moonbaseAlpha, moonbeam],
  transports: {
    [paseoAssetHub.id]: http(),
    [manta.id]: http(),
    [moonbaseAlpha.id]: http(),
    [moonbeam.id]: http(),
  },
  ssr: true,
});

// Default wallets via RainbowKit
const { wallets } = getDefaultWallets();

const config = getDefaultConfig({
  appName: 'DOTUI',
  projectId: 'ddf8cf3ee0013535c3760d4c79c9c8b9',
  wallets: [
    ...wallets,
    {
      groupName: 'Other',
      wallets: [phantomWallet, trustWallet, ledgerWallet],
    },
  ],
  chains: [paseoAssetHub, moonbeam, moonbaseAlpha, manta],
  transports: {
    [paseoAssetHub.id]: http(),
    [moonbeam.id]: http(),
    [moonbaseAlpha.id]: http(),
    [manta.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>{children}</RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </JotaiProvider>
  );
}
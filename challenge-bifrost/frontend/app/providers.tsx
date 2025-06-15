"use client";

import * as React from "react";
import {
  RainbowKitProvider,
  getDefaultWallets,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { trustWallet, ledgerWallet } from "@rainbow-me/rainbowkit/wallets";
import { sepolia, baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, http } from "wagmi";
import { defineChain } from "viem";
import { ThemeProvider } from "next-themes";

/* -------------------------------------------------------------------------- */
/*                                Chain setup                                 */
/* -------------------------------------------------------------------------- */

export const paseoAssetHub = defineChain({
  id: 420420422,
  name: "Paseo AssetHub",
  nativeCurrency: {
    decimals: 18,
    name: "Paseo",
    symbol: "PAS",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-passet-hub-eth-rpc.polkadot.io/"],
      webSocket: ["wss://testnet-passet-hub.polkadot.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Explorer",
      url: "https://blockscout-passet-hub.parity-testnet.parity.io/",
    },
  },
  contracts: {
    multicall3: {
      address: "0x5545dec97cb957e83d3e6a1e82fabfacf9764cf1",
      blockCreated: 10174702,
    },
  },
});

/* -------------------------------------------------------------------------- */

const { wallets } = getDefaultWallets();

const config = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_BIFROST_APP_NAME ?? "Bifrost DApp",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  wallets: [
    ...wallets,
    {
      groupName: "Other",
      wallets: [trustWallet, ledgerWallet],
    },
  ],
  chains: [sepolia, baseSepolia, paseoAssetHub],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA!),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL_BASE_SEPOLIA!),
    [paseoAssetHub.id]: http(process.env.NEXT_PUBLIC_RPC_URL_PASEO_ASSETHUB!),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class">
          <RainbowKitProvider>{children}</RainbowKitProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
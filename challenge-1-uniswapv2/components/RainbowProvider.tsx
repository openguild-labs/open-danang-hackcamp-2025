'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { useState, useEffect } from 'react';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { defineChain } from 'viem';

// Paseo Asset Hub Testnet
const paseoAssetHub = defineChain({
  id: 420420422,
  name: 'Paseo Asset Hub',
  network: 'paseo-asset-hub',
  nativeCurrency: {
    decimals: 18,
    name: 'PAS',
    symbol: 'PAS',
  },
  rpcUrls: {
    default: { http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'] },
    public: { http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'] },
  },
  blockExplorers: {
    default: { name: 'BlockScout', url: 'https://blockscout-passet-hub.parity-testnet.parity.io' },
  },
});

const config = getDefaultConfig({
  appName: 'UniswapV2 DEX',
  projectId: '2f05a7cdc2bb9f5d8a3a9f504a8c8a1c', // Dummy project ID
  chains: [paseoAssetHub],
  ssr: false, // Disable SSR to avoid indexedDB issues
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

interface RainbowProviderProps {
  children: React.ReactNode;
}

export function RainbowProvider({ children }: RainbowProviderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for theme changes
  useEffect(() => {
    if (!mounted) return;

    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Initial theme check
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    return () => observer.disconnect();
  }, [mounted]);

  // Don't render on server
  if (!mounted) {
    return <div>{children}</div>;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={theme === 'dark' ? darkTheme() : lightTheme()}
          showRecentTransactions={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 
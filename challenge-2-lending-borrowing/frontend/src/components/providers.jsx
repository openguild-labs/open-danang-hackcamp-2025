'use client';

import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '../config/wagmi';
import { useState } from 'react';

import '@rainbow-me/rainbowkit/styles.css';

export function Providers({ children }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <WagmiProvider config={config}>
                <RainbowKitProvider>
                    {children}
                </RainbowKitProvider>
            </WagmiProvider>
        </QueryClientProvider>
    );
}

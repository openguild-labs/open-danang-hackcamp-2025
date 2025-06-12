'use client';

import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '../config/wagmi';
import { useState, useEffect } from 'react';

import '@rainbow-me/rainbowkit/styles.css';

export function Providers({ children }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 5,
                cacheTime: 1000 * 60 * 10,
                retry: 3,
            },
        },
    }));

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading DeFi Platform...</p>
                </div>
            </div>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <WagmiProvider config={config}>
                <RainbowKitProvider
                    theme={lightTheme({
                        accentColor: '#3B82F6',
                        accentColorForeground: 'white',
                        borderRadius: 'medium',
                    })}
                    appInfo={{
                        appName: 'DeFi Lending & Borrowing',
                        learnMoreUrl: 'https://docs.polkadot.network/',
                    }}
                >
                    {children}
                </RainbowKitProvider>
            </WagmiProvider>
        </QueryClientProvider>
    );
}

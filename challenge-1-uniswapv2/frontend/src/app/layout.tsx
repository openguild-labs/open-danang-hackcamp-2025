import './globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import type { Metadata } from 'next'
import { Providers } from '../providers/WagmiProvider'

export const metadata: Metadata = {
    title: 'UniswapV2 DEX - Polkadot Asset Hub',
    description: 'Decentralized Exchange for Polkadot Asset Hub',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="bg-slate-900 text-white">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
}

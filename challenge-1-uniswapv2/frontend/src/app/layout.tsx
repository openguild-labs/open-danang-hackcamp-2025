import './globals.css'
import type { Metadata } from 'next'

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
                {children}
            </body>
        </html>
    )
}

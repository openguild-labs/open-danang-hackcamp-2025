import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SimpleWalletProvider } from '@/components/SimpleWalletProvider'
import { ToastProvider } from '@/components/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UniswapV2 DEX - Polkadot Asset Hub',
  description: 'Decentralized Exchange on Polkadot Asset Hub',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SimpleWalletProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SimpleWalletProvider>
      </body>
    </html>
  )
} 
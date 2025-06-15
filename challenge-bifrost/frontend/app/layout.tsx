import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import "@rainbow-me/rainbowkit/styles.css"

import { Providers } from "@/app/providers"
import Header from "@/components/header"
import AiAgent from "@/components/ai-agent"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Bifrost Components",
  description: "A collection of components for interacting with Bifrost protocol",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <Header />
          <main>{children}</main>
          <AiAgent />
        </Providers>
      </body>
    </html>
  )
}
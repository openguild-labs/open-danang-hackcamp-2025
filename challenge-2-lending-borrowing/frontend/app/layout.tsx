import type { Metadata } from "next";
import { Unbounded } from "next/font/google";
import "./globals.css";
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from '@/app/providers';
import Header from '@/components/header';
import { Toaster } from "@/components/ui/toaster";

const unbounded = Unbounded({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "OpenGuild DaNang Hackcamp 2025",
  description: "a UI kit for Polkadot DApps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={unbounded.className}>
        <Providers>
          <main className="min-h-screen bg-background">
            {children}
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

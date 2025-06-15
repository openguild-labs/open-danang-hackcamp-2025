import type { Metadata } from "next";
import { Unbounded } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "@/app/providers";
import Header from "@/components/header";

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DOT UI kit",
  description: "A sleek UI kit for Polkadot dApps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={unbounded.className}>
        <Providers>
          <Header />
          <main className="flex min-h-[calc(100vh-80px)] flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
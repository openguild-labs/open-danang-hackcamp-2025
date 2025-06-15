"use client";

import Image from "next/image";
import Link from "next/link";
import SigpassKit from "@/components/sigpasskit";
import Navbar from "@/components/navbar";

export default function Header() {
  return (
    <header className="w-full border-b border-border/50 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/30">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/og-logo.png"
            alt="DOT UI logo"
            width={120}
            height={28}
            priority
            className="object-contain dark:invert"
          />
        </Link>

        {/* Navigation links */}
        <Navbar />

        {/* Wallet / Connect buttons */}
        <SigpassKit />
      </div>
    </header>
  );
}
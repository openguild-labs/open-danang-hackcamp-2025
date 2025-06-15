"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "./navbar";
import SigpassKit from "./sigpasskit";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/og-logo.png"
            alt="OpenGuild logo"
            width={140}
            height={30}
            priority
            className="dark:invert"
          />
        </Link>

        <Navbar />

        <div className="flex items-center gap-2">
          <SigpassKit />
        </div>
      </div>
    </header>
  );
}
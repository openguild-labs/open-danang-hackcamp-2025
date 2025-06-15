"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="hidden md:flex items-center gap-6">
      <Link
        href="/"
        className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        Home
      </Link>
      <Link
        href="/send-transaction"
        className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        Send Transaction
      </Link>
      <Link
        href="/write-contract"
        className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        Write Contract
      </Link>
      <Link
        href="/mint-redeem-lst-bifrost"
        className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        Mint/Redeem LST
      </Link>
      <Link
        href="/uniswapv2"
        className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        DEX
      </Link>
    </nav>
  );
}
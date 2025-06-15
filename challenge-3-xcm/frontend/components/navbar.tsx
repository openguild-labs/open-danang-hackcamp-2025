"use client";

import Link from "next/link";

export default function Navbar() {
  const linkClass =
    "text-sm font-medium transition-colors hover:text-primary";
  return (
    <nav className="flex flex-wrap items-center justify-center gap-4">
      <Link className={linkClass} href="/">
        Home
      </Link>
      <Link className={linkClass} href="/send-transaction">
        Send Tx
      </Link>
      <Link className={linkClass} href="/write-contract">
        Write Contract
      </Link>
      <Link className={linkClass} href="/mint-redeem-lst-bifrost">
        LST Bifrost
      </Link>
      <Link className={linkClass} href="/swap-hydration">
        Swap (Hydration)
      </Link>
    </nav>
  );
}
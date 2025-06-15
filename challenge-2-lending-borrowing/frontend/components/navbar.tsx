"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import SigpassKit from "@/components/sigpasskit";
import { Menu } from "lucide-react";

/**
 * Top‑level navigation bar used across the entire application.
 * Includes brand logo, primary links and wallet controls (SigpassKit).
 */
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Removed Wallet link per request
  const links = [
    { href: "/send-transaction", label: "Send Tx" },
    { href: "/write-contract", label: "Write Contract" },
    { href: "/mint-redeem-lst-bifrost", label: "LST Bifrost" },
    { href: "/lending-borrowing", label: "Lending / Borrowing" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur bg-background/70 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Image
            src="/og-logo.png"
            alt="DotUI logo"
            width={32}
            height={32}
            priority
            className="h-8 w-8"
          />
          DotUI
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-4 py-2 rounded-md hover:bg-secondary/50 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop wallet */}
        <div className="hidden md:block">
          {/* Disable create‑wallet dialog, only show connect button */}
          <SigpassKit disableCreate />
        </div>

        {/* Mobile menu button */}
        <button
          aria-label="Open menu"
          className="md:hidden p-2 rounded-md hover:bg-secondary/50"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile overlay menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-background/90 backdrop-blur">
          <div className="flex justify-end p-4">
            <button
              aria-label="Close menu"
              className="p-2 rounded-md hover:bg-secondary/50"
              onClick={() => setMobileOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center gap-6">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-lg font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            {/* Mobile wallet (connect only) */}
            <SigpassKit disableCreate />
          </div>
        </div>
      )}
    </header>
  )
}
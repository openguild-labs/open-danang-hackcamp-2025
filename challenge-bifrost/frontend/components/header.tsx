import Image from "next/image";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const APP_NAME = process.env.NEXT_PUBLIC_BIFROST_APP_NAME ?? "Bifrost";

export default function Header() {
  return (
    <header className="w-full border-b bg-background/60 backdrop-blur supports-backdrop-blur:bg-background/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/bifrost.svg"
            alt={`${APP_NAME} logo`}
            width={32}
            height={32}
            priority
          />
          <span className="text-2xl font-semibold tracking-tight">
            {APP_NAME}
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 justify-center gap-2">
          <Button asChild variant="outline-primary" size="sm">
            <Link href="/">Dashboard</Link>
          </Button>
          <Button asChild variant="outline-primary" size="sm">
            <Link href="/mint-redeem-component">Mint&nbsp;/&nbsp;Redeem</Link>
          </Button>
          <Button asChild variant="outline-primary" size="sm">
            <Link href="/yield-delegation-vault-component">Vault</Link>
          </Button>
          <Button asChild variant="outline-primary" size="sm">
            <Link href="/ai-chat">AI&nbsp;Assistant</Link>
          </Button>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}
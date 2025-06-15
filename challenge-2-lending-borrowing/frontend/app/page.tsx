"use client";

import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-pink-500/40 to-indigo-600/30 opacity-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-24 lg:py-32 gap-8">
          <Image
            src="/og-logo.png"
            alt="DotUI Logo"
            width={200}
            height={60}
            priority
            className="dark:invert"
          />
          {/* Responsive heading with clamp to avoid overflow */}
          <h1 className="font-extrabold tracking-tight leading-tight max-w-3xl text-balance break-words"
              style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}>
            Build&nbsp;Seamless&nbsp;Polkadot&nbsp;dApps
          </h1>
          <p className="max-w-xl text-muted-foreground text-lg sm:text-xl">
            An opinionated UI kit with ready‑made Web3 components, hooks and beautiful styles to kick‑start your Polkadot Asset&nbsp;Hub project.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/lending-borrowing"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-all font-medium"
            >
              Explore Lending Demo
            </Link>
            <Link
              href="https://github.com/buildstationorg/dotui"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-border hover:bg-secondary/40 transition-all font-medium"
            >
              GitHub&nbsp;Repo
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 bg-secondary/30 backdrop-blur-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Send Transaction"
            description="Transfer assets with a few clicks."
            href="/send-transaction"
          />
          <FeatureCard
            title="Write Contract"
            description="Interact with any ERC‑20 smart contract."
            href="/write-contract"
          />
          <FeatureCard
            title="Mint / Redeem LST"
            description="Handle Bifrost LST mint and redemption."
            href="/mint-redeem-lst-bifrost"
          />
          <FeatureCard
            title="Lending & Borrowing"
            description="Deposit collateral and borrow assets."
            href="/lending-borrowing"
          />
          <FeatureCard
            title="Docs"
            description="Dive into component and hook guides."
            href="https://github.com/buildstationorg/dotui/tree/main/docs"
            external
          />
        </div>
      </section>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        © 2025 DotUI by OpenGuild — Built with ❤️ for Polkadot ecosystem
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  href,
  external = false,
}: {
  title: string;
  description: string;
  href: string;
  external?: boolean;
}) {
  const classes =
    "group relative rounded-xl border border-border bg-card/60 p-6 backdrop-blur hover:shadow-lg transition-shadow";
  const linkProps = external
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : { href };

  return (
    <Link {...linkProps} className={classes}>
      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
        {title}
        <span className="inline-block transition-transform group-hover:translate-x-1">
          →
        </span>
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
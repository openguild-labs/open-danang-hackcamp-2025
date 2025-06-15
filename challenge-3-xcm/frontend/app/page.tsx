import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-12 px-6 py-20 text-center">
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/og-logo.png"
          alt="DOT UI logo"
          width={260}
          height={60}
          priority
          className="dark:invert"
        />
        <h1 className="max-w-xl text-balance text-4xl font-extrabold leading-tight md:text-5xl">
          Rapid‑start UI toolkit for building{" "}
          <span className="text-primary">Polkadot</span> dApps
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Pre‑configured Next.js, Tailwind CSS & RainbowKit stack with ready‑made
          web3 components so you can ship in minutes.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/swap-hydration"
            className="rounded-md bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Explore demos
          </Link>
          <a
            href="https://github.com/buildstationorg/dotui"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-input px-6 py-3 transition-colors hover:bg-accent"
          >
            Star on GitHub
          </a>
        </div>
      </div>

      <div className="grid w-full gap-6 md:grid-cols-2">
        {[
          { href: "/send-transaction", label: "Send Transaction" },
          { href: "/write-contract", label: "Write Contract" },
          { href: "/mint-redeem-lst-bifrost", label: "Mint/Redeem LST" },
          { href: "/swap-hydration", label: "Swap on Hydration" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group relative rounded-lg border border-border p-6 text-left transition-shadow hover:shadow-lg"
          >
            <span className="text-lg font-semibold">{l.label}</span>
            <span className="absolute right-6 top-6 text-primary transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
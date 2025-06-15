import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 blur-3xl" />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 text-center sm:gap-16">
        <Image
          src="/og-logo.png"
          alt="OpenGuild logo"
          width={220}
          height={46}
          priority
          className="dark:invert"
        />
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Polkadot DApp UI Kit
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Kick‑start your next Polkadot project with gorgeous, production‑ready
          components, in‑dapp wallet, and seamless chain integrations.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/uniswapv2"
            className="rounded-lg bg-primary px-6 py-3 text-primary-foreground font-semibold shadow transition hover:opacity-90"
          >
            Launch DEX Demo
          </Link>
          <a
            href="https://github.com/buildstationorg/dotui"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border px-6 py-3 font-semibold transition hover:bg-accent"
          >
            GitHub
          </a>
        </div>
      </div>

      <div className="mx-auto mt-24 grid max-w-6xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/uniswapv2", title: "DEX" },
          { href: "/send-transaction", title: "Send Transaction" },
          { href: "/write-contract", title: "Write Contract" },
          { href: "/mint-redeem-lst-bifrost", title: "Mint/Redeem LST" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl border border-border p-6 transition hover:bg-accent"
          >
            <h3 className="text-lg font-semibold leading-snug group-hover:text-primary">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Quick preview &rarr;
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
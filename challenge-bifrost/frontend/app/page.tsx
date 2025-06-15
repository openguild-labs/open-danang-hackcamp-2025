import Link from "next/link"
import { ArrowRight, MessageSquare } from "lucide-react"

export default function Dashboard() {
  return (
    <section className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white">
      {/* Decorative background overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[url('/hero-bg.png')] bg-cover bg-center opacity-10" />
      <div className="relative w-full max-w-5xl px-6">
        <div className="grid gap-12 sm:gap-16">
          {/* Hero */}
          <header className="text-center">
            <h1 className="text-5xl font-bold tracking-tight drop-shadow-lg">
              Welcome to Bifrost Dashboard
            </h1>
            <p className="mt-4 text-xl text-white/90">
              Mint, redeem and manage your liquid staking tokens effortlessly
            </p>
          </header>

          {/* Quick-action tiles */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Link
              href="/mint-redeem-component"
              className="outline-tile group flex flex-col gap-4 rounded-xl bg-white/10 p-8 backdrop-blur-lg transition-colors hover:bg-white/15"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Start Minting</h2>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-white/80">
                Swap your native assets for vETH or vDOT in a single click.
              </p>
            </Link>

            <Link
              href="/ai-chat"
              className="outline-tile group flex flex-col gap-4 rounded-xl bg-white/10 p-8 backdrop-blur-lg transition-colors hover:bg-white/15"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">AI Assistant</h2>
                <MessageSquare className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-white/80">
                Get step-by-step guidance and insights with Bifrost AI.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
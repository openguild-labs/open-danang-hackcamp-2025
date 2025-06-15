import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Coins, TrendingUp, Shield, Zap, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const features = [
    {
      icon: Coins,
      title: "Token Swapping",
      description: "Trade tokens instantly with minimal slippage using our automated market maker protocol.",
      href: "/swap"
    },
    {
      icon: TrendingUp,
      title: "Liquidity Pools",
      description: "Provide liquidity and earn trading fees from every transaction in the pool.",
      href: "/liquidity-pool"
    },
    {
      icon: Shield,
      title: "Secure & Decentralized",
      description: "Built on proven UniswapV2 technology with smart contracts ensuring trustless trading."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Execute trades in seconds with optimized gas usage and minimal transaction costs."
    }
  ];

  const stats = [
    { label: "Total Value Locked", value: "$2.5M+", icon: BarChart3 },
    { label: "Trading Pairs", value: "50+", icon: Coins },
    { label: "Active Users", value: "1,200+", icon: Users },
    { label: "Transactions", value: "25,000+", icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <Image
                src="/og-logo.png"
                alt="OpenGuild logo"
                width={200}
                height={42}
                priority
                className="h-10 w-auto sm:h-12"
              />
            </div>

            {/* Hero Content */}
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl">
              Decentralized Exchange
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Powered by UniswapV2
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300 sm:text-xl">
              Trade tokens, provide liquidity, and earn fees on the most trusted decentralized exchange protocol.
              Built for the community, by the community.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/swap">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Start Trading
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Link href="/liquidity-pool">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 px-8 py-3 text-lg font-semibold transition-all duration-300"
                >
                  Add Liquidity
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]">
            <div className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-blue-400 to-purple-400 opacity-20"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat, index) => (
              <Card key={index} className="border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <stat.icon className="mx-auto h-8 w-8 text-blue-600 dark:text-blue-400 mb-3" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Why Choose Our DEX?
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Experience the future of decentralized finance with our cutting-edge features
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="group border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {feature.description}
                  </p>
                  {feature.href && (
                    <Link href={feature.href} className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
                      Learn More
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Get started with decentralized trading in three simple steps
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Connect Wallet
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect your Web3 wallet to access the decentralized exchange
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Select Tokens
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Choose the tokens you want to trade or provide as liquidity
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Trade or Earn
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Execute trades or provide liquidity to earn trading fees
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Ready to Start Trading?
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Join thousands of traders and liquidity providers on our decentralized exchange
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/swap">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Launch App
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-6">
              <Image
                src="/og-logo.png"
                alt="OpenGuild logo"
                width={120}
                height={25}
                className="h-6 w-auto"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link
                href="/swap"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Swap
              </Link>
              <Link
                href="/liquidity-pool"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Liquidity
              </Link>
              <a
                href="https://openguild.wtf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                OpenGuild
              </a>
              <a
                href="https://buildstation.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                BuildStation
              </a>
            </div>

            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>Maintained by <a className="underline underline-offset-4 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" href="https://buildstation.org" target="_blank" rel="noopener noreferrer">buildstation.org</a> with support from <a className="underline underline-offset-4 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" href="https://openguild.wtf" target="_blank" rel="noopener noreferrer">OpenGuild</a></p>
              <p className="mt-2">© 2024 UniswapV2 DEX. Built on decentralized technology.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

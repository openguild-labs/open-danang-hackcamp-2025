import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="flex flex-col gap-8 row-start-2 items-center sm:items-start max-w-4xl">
        <Image
          src="/og-logo.png"
          alt="OpenGuild logo"
          width={180}
          height={38}
          priority
        />

        {/* Hero Section */}
        <div className="text-center sm:text-left">
          <h1 className="text-4xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            DeFi Lending Platform
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-6">
            Lend, borrow, and earn with confidence on the blockchain
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
            Experience seamless decentralized finance with our secure lending and borrowing protocol.
            Earn competitive yields or access instant liquidity with your crypto assets.
          </p>
        </div>

        {/* Platform Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mt-8">
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2 text-green-600">💰 Lend</h3>
            <p className="text-gray-600 dark:text-gray-300">Supply your assets and earn competitive interest rates</p>
          </div>
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2 text-blue-600">🏦 Borrow</h3>
            <p className="text-gray-600 dark:text-gray-300">Access instant liquidity against your collateral</p>
          </div>
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2 text-purple-600">📊 Earn</h3>
            <p className="text-gray-600 dark:text-gray-300">Maximize your yield with our optimized strategies</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="w-full">
          <p className="mb-4 text-lg font-medium">Get started with our platform:</p>
          <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)] space-y-3">
            <li className="mb-2">
              <Link href="/wallet" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-4">
                Connect Your Wallet
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/lend" className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 underline underline-offset-4">
                Start Lending & Earning
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/borrow" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-4">
                Borrow Against Collateral
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/dashboard" className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 underline underline-offset-4">
                View Dashboard
              </Link>
            </li>
          </ol>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 text-sm sm:text-base h-10 sm:h-12 px-6 sm:px-8"
            href="/lend"
          >
            Start Lending
          </Link>
          <Link
            className="rounded-full border border-solid border-blue-600 text-blue-600 transition-colors flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900 hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-6 sm:px-8 sm:min-w-44"
            href="/dashboard"
          >
            View Dashboard
          </Link>
        </div>
      </div>

      {/* Footer code */}
      <footer className="row-start-3 flex flex-col gap-4">
        <div className="text-sm text-muted-foreground">
          Maintained by <a className="underline underline-offset-4" href="https://buildstation.org" target="_blank" rel="noopener noreferrer">buildstation.org</a> with support from <a className="underline underline-offset-4" href="https://openguild.wtf" target="_blank" rel="noopener noreferrer">OpenGuild</a>
        </div>
      </footer>
    </div>
  );
}

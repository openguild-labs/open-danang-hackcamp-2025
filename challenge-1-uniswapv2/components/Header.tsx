'use client';

import { useState } from 'react';
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn, truncateAddress } from '@/lib/utils';

interface HeaderProps {
  isConnected: boolean;
  account?: string;
  chainId?: number;
  onConnect: () => void;
  onDisconnect: () => void;
  isDark: boolean;
  onThemeToggle: () => void;
}

export default function Header({ 
  isConnected, 
  account, 
  chainId, 
  onConnect, 
  onDisconnect,
  isDark,
  onThemeToggle
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isCorrectNetwork = chainId === 420420422;

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">U</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  UniswapV2
                </span>
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full">
                  Paseo
                </span>
              </div>
            </div>

            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              <a href="#" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Swap
              </a>
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Liquidity
              </a>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {isConnected && (
              <div className={cn(
                "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
                isCorrectNetwork 
                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
              )}>
                <div className={cn("w-2 h-2 rounded-full", isCorrectNetwork ? "bg-green-500" : "bg-red-500")} />
                {isCorrectNetwork ? "Paseo Asset Hub" : "Wrong Network"}
              </div>
            )}

            <button onClick={onThemeToggle} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {isDark ? (
                <SunIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            <div className="flex items-center">
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {account ? truncateAddress(account) : 'Connected'}
                    </span>
                  </div>
                  <button onClick={onDisconnect} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Disconnect
                  </button>
                </div>
              ) : (
                <button onClick={onConnect} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl">
                  Connect Wallet
                </button>
              )}
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {isMenuOpen ? (
                  <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Swap
              </a>
              <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Liquidity
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 
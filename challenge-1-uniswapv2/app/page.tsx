'use client';

import { useState, useEffect } from 'react';
import { ArrowsUpDownIcon, CogIcon, MoonIcon, SunIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useSimpleWallet } from '@/components/SimpleWalletProvider';
import { useSimpleSwap, useTokenBalance } from '@/hooks/useSimpleSwap';
import { useSwapPrice } from '@/hooks/useSwapPrice';
import { TOKENS, Token } from '@/lib/tokens';

export default function Home() {
  const [theme, setTheme] = useState('light');
  const [fromToken, setFromToken] = useState<Token>(TOKENS.PAS);
  const [toToken, setToToken] = useState<Token>(TOKENS.WETH);
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);

  // Simple wallet hooks
  const { address, isConnected, isCorrectNetwork, connectWallet, disconnect, switchToCorrectNetwork, chainId } = useSimpleWallet();
  const { balance: fromBalance, refetch: refetchFromBalance } = useTokenBalance(fromToken, address || undefined);
  const { balance: toBalance, refetch: refetchToBalance } = useTokenBalance(toToken, address || undefined);
  const { swap, isSwapping, swapError, txHash } = useSimpleSwap();
  
  // Real price calculation from blockchain
  const { toAmount, isLoading: isPriceLoading, error: priceError } = useSwapPrice(fromToken, toToken, fromAmount);

  // Fetch balances when connected
  useEffect(() => {
    if (isConnected && address) {
      refetchFromBalance();
      refetchToBalance();
    }
  }, [isConnected, address, fromToken, toToken]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
  };

  const handleSwap = async () => {
    if (!address || !fromAmount || !toAmount) return;

    const result = await swap(fromToken, toToken, fromAmount, address);
    if (result.success) {
      setFromAmount('');
      // Refetch balances after successful transaction
      setTimeout(() => {
        refetchFromBalance();
        refetchToBalance();
      }, 3000);
    }
  };

  const canSwap = isConnected && 
                  isCorrectNetwork && 
                  fromAmount && 
                  parseFloat(fromAmount) > 0 && 
                  parseFloat(fromBalance) >= parseFloat(fromAmount);

  const getSwapButtonText = () => {
    if (!isConnected) return 'Connect Wallet';
    if (!isCorrectNetwork) return 'Switch Network';
    if (!fromAmount) return 'Enter Amount';
    if (parseFloat(fromBalance) < parseFloat(fromAmount)) return 'Insufficient Balance';
    if (isSwapping) return 'Confirming Transaction...';
    return 'Swap';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="w-full p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
            <h1 className="text-xl font-bold gradient-text">UniswapV2 DEX</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>

            {/* Network Status */}
            <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
              isConnected && isCorrectNetwork 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {isConnected 
                ? isCorrectNetwork 
                  ? 'Paseo Asset Hub' 
                  : `Wrong Network (${chainId})`
                : 'Not Connected'
              }
            </div>
            
            {/* Simple Connect Button */}
            <button
              onClick={() => isConnected ? disconnect() : connectWallet()}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isConnected
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect MetaMask'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 gradient-text">Trade tokens instantly</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Swap tokens seamlessly on Polkadot Asset Hub with MetaMask
          </p>
        </div>

        {/* Network Warning */}
        {isConnected && !isCorrectNetwork && (
          <div className="max-w-md mx-auto mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-200">Wrong Network</h3>
                  <p className="text-sm text-red-600 dark:text-red-400">Please switch to Paseo Asset Hub</p>
                </div>
              </div>
              <button
                onClick={switchToCorrectNetwork}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Switch Network
              </button>
            </div>
          </div>
        )}



        {/* Swap Interface */}
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Swap</h3>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <CogIcon className="w-5 h-5" />
              </button>
            </div>

            {/* From Token */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>From</span>
                <span>Balance: {parseFloat(fromBalance).toFixed(4)} {fromToken.symbol}</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    placeholder="0.0"
                    className="bg-transparent text-2xl font-semibold outline-none flex-1"
                  />
                  <div className="flex items-center space-x-2">
                    <select 
                      value={fromToken.symbol}
                      onChange={(e) => setFromToken(TOKENS[e.target.value])}
                      className="bg-white dark:bg-gray-600 px-3 py-2 rounded-lg font-medium border-0 outline-none"
                    >
                      {Object.values(TOKENS).map(token => (
                        <option key={token.symbol} value={token.symbol}>
                          {token.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center mb-4">
              <button
                onClick={swapTokens}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <ArrowsUpDownIcon className="w-5 h-5" />
              </button>
            </div>

            {/* To Token */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>To</span>
                <span>Balance: {parseFloat(toBalance).toFixed(4)} {toToken.symbol}</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={isPriceLoading ? 'Calculating...' : toAmount}
                    readOnly
                    placeholder="0.0"
                    className="bg-transparent text-2xl font-semibold outline-none flex-1"
                  />
                  <div className="flex items-center space-x-2">
                    <select 
                      value={toToken.symbol}
                      onChange={(e) => setToToken(TOKENS[e.target.value])}
                      className="bg-white dark:bg-gray-600 px-3 py-2 rounded-lg font-medium border-0 outline-none"
                    >
                      {Object.values(TOKENS).map(token => (
                        <option key={token.symbol} value={token.symbol}>
                          {token.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Slippage Settings */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Slippage Tolerance</span>
                <span className="text-sm font-medium">{slippage}%</span>
              </div>
              <div className="flex space-x-2">
                {[0.1, 0.5, 1.0].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      slippage === value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {swapError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{swapError}</p>
              </div>
            )}

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              disabled={!canSwap || isSwapping}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {getSwapButtonText()}
            </button>
          </div>
        </div>

        {/* Contract Info */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-center">Deployed Contracts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
              <h4 className="font-semibold mb-2">Factory</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono break-all">
                0xcC7Cf672147325f9dE0629C0ffccBC5724a5A4AE
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
              <h4 className="font-semibold mb-2">WETH</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono break-all">
                0x9E74fC88465Ca0a8E3899D3aD235C99b127bc21D
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
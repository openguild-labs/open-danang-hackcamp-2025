'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, MinusIcon, CogIcon, MoonIcon, SunIcon, ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useWallet, useTokenBalance, usePairAddress, useCreatePair } from '@/hooks/useWeb3'
import { TOKENS, Token } from '@/lib/tokens'
import Link from 'next/link'

export default function PoolPage() {
  const [theme, setTheme] = useState('light')
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add')
  const [tokenA, setTokenA] = useState<Token>(TOKENS.PAS)
  const [tokenB, setTokenB] = useState<Token>(TOKENS.WETH)
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false)
  const [isRemovingLiquidity, setIsRemovingLiquidity] = useState(false)

  // Web3 hooks
  const { address, isConnected, isCorrectNetwork, connectWallet, disconnect, switchToCorrectNetwork, isSwitching, chainId } = useWallet()
  const { balance: balanceA, refetch: refetchBalanceA } = useTokenBalance(tokenA, address)
  const { balance: balanceB, refetch: refetchBalanceB } = useTokenBalance(tokenB, address)
  const { pairAddress, exists: pairExists } = usePairAddress(tokenA, tokenB)
  const { createPair, isCreating, createError } = useCreatePair()

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const handleAddLiquidity = async () => {
    if (!address || !amountA || !amountB) return
    
    setIsAddingLiquidity(true)
    try {
      // Simulate add liquidity
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Liquidity added successfully!')
      setAmountA('')
      setAmountB('')
      refetchBalanceA()
      refetchBalanceB()
    } catch (error) {
      alert('Failed to add liquidity')
    } finally {
      setIsAddingLiquidity(false)
    }
  }

  const handleRemoveLiquidity = async () => {
    if (!address || !amountA) return
    
    setIsRemovingLiquidity(true)
    try {
      // Simulate remove liquidity
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Liquidity removed successfully!')
      setAmountA('')
      setAmountB('')
      refetchBalanceA()
      refetchBalanceB()
    } catch (error) {
      alert('Failed to remove liquidity')
    } finally {
      setIsRemovingLiquidity(false)
    }
  }

  const handleCreatePair = async () => {
    const result = await createPair(tokenA, tokenB)
    if (result.success) {
      alert('Pair creation initiated! Please wait for confirmation.')
    }
  }

  // Mock price calculation
  useEffect(() => {
    if (amountA && activeTab === 'add') {
      const rate = tokenA.symbol === 'PAS' ? 0.0004 : 2500
      setAmountB((parseFloat(amountA) * rate).toFixed(6))
    }
  }, [amountA, tokenA.symbol, activeTab])

  const canAddLiquidity = isConnected && 
                         isCorrectNetwork && 
                         amountA && 
                         amountB &&
                         parseFloat(balanceA) >= parseFloat(amountA) &&
                         parseFloat(balanceB) >= parseFloat(amountB) &&
                         pairExists

  const canRemoveLiquidity = isConnected && 
                            isCorrectNetwork && 
                            amountA &&
                            pairExists

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="w-full p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
            <h1 className="text-xl font-bold gradient-text">Pool Management</h1>
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
            
            <button
              onClick={() => isConnected ? disconnect() : connectWallet()}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isConnected
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 gradient-text">Manage Liquidity Pools</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Add or remove liquidity to earn fees from trades
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
                disabled={isSwitching}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isSwitching ? 'Switching...' : 'Switch Network'}
              </button>
            </div>
          </div>
        )}

        {/* Pool Interface */}
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
            {/* Tab Headers */}
            <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('add')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'add'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <PlusIcon className="w-4 h-4 inline mr-2" />
                Add Liquidity
              </button>
              <button
                onClick={() => setActiveTab('remove')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'remove'
                    ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <MinusIcon className="w-4 h-4 inline mr-2" />
                Remove Liquidity
              </button>
            </div>

            {/* Token A */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Token A</span>
                <span>Balance: {parseFloat(balanceA).toFixed(4)} {tokenA.symbol}</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={amountA}
                    onChange={(e) => setAmountA(e.target.value)}
                    placeholder="0.0"
                    className="bg-transparent text-2xl font-semibold outline-none flex-1"
                  />
                  <div className="flex items-center space-x-2">
                    <select 
                      value={tokenA.symbol}
                      onChange={(e) => setTokenA(TOKENS[e.target.value])}
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

            {/* Plus Icon */}
            <div className="flex justify-center mb-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <PlusIcon className="w-5 h-5" />
              </div>
            </div>

            {/* Token B */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Token B</span>
                <span>Balance: {parseFloat(balanceB).toFixed(4)} {tokenB.symbol}</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={amountB}
                    onChange={(e) => activeTab === 'remove' ? setAmountB(e.target.value) : null}
                    readOnly={activeTab === 'add'}
                    placeholder="0.0"
                    className="bg-transparent text-2xl font-semibold outline-none flex-1"
                  />
                  <div className="flex items-center space-x-2">
                    <select 
                      value={tokenB.symbol}
                      onChange={(e) => setTokenB(TOKENS[e.target.value])}
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

            {/* Pair Status */}
            {!pairExists && tokenA.symbol !== tokenB.symbol && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Pool not found. Pool needs to be created first.
                  </p>
                  <button
                    onClick={handleCreatePair}
                    disabled={isCreating || !isConnected || !isCorrectNetwork}
                    className="px-3 py-1 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create Pool'}
                  </button>
                </div>
              </div>
            )}

            {/* Pool Info */}
            {pairExists && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Pool Information</p>
                  <p>Pool Address: {pairAddress?.slice(0, 8)}...{pairAddress?.slice(-6)}</p>
                  <p>Your Pool Share: 0.00%</p>
                  <p>Pool Fee: 0.3%</p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {createError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{createError}</p>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={activeTab === 'add' ? handleAddLiquidity : handleRemoveLiquidity}
              disabled={
                activeTab === 'add' 
                  ? !canAddLiquidity || isAddingLiquidity
                  : !canRemoveLiquidity || isRemovingLiquidity
              }
              className={`w-full py-4 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'add'
                  ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700'
                  : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700'
              }`}
            >
              {!isConnected ? 'Connect Wallet' : 
               !isCorrectNetwork ? 'Switch Network' :
               !pairExists ? 'Pool Not Found' :
               activeTab === 'add' ? (
                 !amountA || !amountB ? 'Enter Amounts' :
                 parseFloat(balanceA) < parseFloat(amountA) || parseFloat(balanceB) < parseFloat(amountB) ? 'Insufficient Balance' :
                 isAddingLiquidity ? 'Adding Liquidity...' : 'Add Liquidity'
               ) : (
                 !amountA ? 'Enter Amount' :
                 isRemovingLiquidity ? 'Removing Liquidity...' : 'Remove Liquidity'
               )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Swap
          </Link>
        </div>
      </main>
    </div>
  )
} 
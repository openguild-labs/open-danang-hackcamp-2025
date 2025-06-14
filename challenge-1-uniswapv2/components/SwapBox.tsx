'use client';

import { useState, useEffect } from 'react';
import { ArrowsUpDownIcon, CogIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import TokenSelector from './TokenSelector';
import { Token, NATIVE_TOKEN } from '@/lib/tokens';
import { cn, formatTokenAmount, formatPercent, calculatePriceImpact, isValidAmount } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SwapBoxProps {
  onSwap: (tokenA: Token, tokenB: Token, amountA: string, amountB: string, slippage: number) => Promise<void>;
  isConnected: boolean;
  isLoading?: boolean;
}

export default function SwapBox({ onSwap, isConnected, isLoading = false }: SwapBoxProps) {
  const [tokenA, setTokenA] = useState<Token | null>(NATIVE_TOKEN);
  const [tokenB, setTokenB] = useState<Token | null>(null);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [customSlippage, setCustomSlippage] = useState('');
  const [priceImpact, setPriceImpact] = useState(0);
  const [exchangeRate, setExchangeRate] = useState('');
  
  const { toast } = useToast();

  // Mock reserves for calculation (in real app, fetch from contracts)
  const mockReserves = {
    [NATIVE_TOKEN.address]: '1000000',
    '0x9E74fC88465Ca0a8E3899D3aD235C99b127bc21D': '500000', // WETH
    '0x8D6e37347A6020B5D0902D15257F28a2c19B4145': '750000', // TKA
    '0x2251bf61f55e22dAa392b0e83A66f2DbF21176fb': '800000', // TKB
  };

  // Calculate output amount (simplified AMM formula)
  const calculateOutputAmount = (inputAmount: string, tokenIn: Token, tokenOut: Token): string => {
    if (!inputAmount || !tokenIn || !tokenOut || !isValidAmount(inputAmount)) return '';
    
    const reserveIn = parseFloat(mockReserves[tokenIn.address] || '0');
    const reserveOut = parseFloat(mockReserves[tokenOut.address] || '0');
    const amountIn = parseFloat(inputAmount);
    
    if (reserveIn === 0 || reserveOut === 0) return '';
    
    // Simplified AMM formula: amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
    const amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);
    
    // Calculate price impact
    const impact = calculatePriceImpact(inputAmount, amountOut.toString(), reserveIn.toString(), reserveOut.toString());
    setPriceImpact(impact);
    
    // Set exchange rate
    setExchangeRate(`1 ${tokenIn.symbol} = ${(amountOut / amountIn).toFixed(6)} ${tokenOut.symbol}`);
    
    return amountOut.toFixed(6);
  };

  // Handle input change
  const handleAmountAChange = (value: string) => {
    setAmountA(value);
    if (tokenA && tokenB) {
      const outputAmount = calculateOutputAmount(value, tokenA, tokenB);
      setAmountB(outputAmount);
    }
  };

  // Handle output change (reverse calculation)
  const handleAmountBChange = (value: string) => {
    setAmountB(value);
    if (tokenA && tokenB) {
      const inputAmount = calculateOutputAmount(value, tokenB, tokenA);
      setAmountA(inputAmount);
    }
  };

  // Swap tokens
  const handleSwapTokens = () => {
    const tempToken = tokenA;
    setTokenA(tokenB);
    setTokenB(tempToken);
    
    const tempAmount = amountA;
    setAmountA(amountB);
    setAmountB(tempAmount);
  };

  // Handle slippage change
  const handleSlippageChange = (value: number) => {
    setSlippage(value);
    setCustomSlippage('');
    setShowSlippageSettings(false);
  };

  const handleCustomSlippageChange = (value: string) => {
    setCustomSlippage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 50) {
      setSlippage(numValue);
    }
  };

  // Handle swap
  const handleSwap = async () => {
    if (!tokenA || !tokenB || !isValidAmount(amountA) || !isValidAmount(amountB)) {
      toast({
        title: "Invalid Input",
        description: "Please select tokens and enter valid amounts",
        variant: "destructive"
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to continue",
        variant: "destructive"
      });
      return;
    }

    try {
      await onSwap(tokenA, tokenB, amountA, amountB, slippage);
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  // Get swap button text
  const getSwapButtonText = () => {
    if (!isConnected) return 'Connect Wallet';
    if (!tokenA || !tokenB) return 'Select Tokens';
    if (!isValidAmount(amountA)) return 'Enter Amount';
    if (isLoading) return 'Swapping...';
    return `Swap ${tokenA.symbol} for ${tokenB.symbol}`;
  };

  const canSwap = isConnected && tokenA && tokenB && isValidAmount(amountA) && !isLoading;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Swap</h2>
          <button
            onClick={() => setShowSlippageSettings(!showSlippageSettings)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <CogIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Slippage Settings */}
        {showSlippageSettings && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Slippage Tolerance
            </h3>
            <div className="flex gap-2 mb-3">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  onClick={() => handleSlippageChange(value)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                    slippage === value
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                  )}
                >
                  {value}%
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Custom"
                value={customSlippage}
                onChange={(e) => handleCustomSlippageChange(e.target.value)}
                className="flex-1 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                min="0"
                max="50"
                step="0.1"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
            </div>
          </div>
        )}

        {/* Token Input A */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From</label>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Balance: 0.00
            </div>
          </div>
          <div className="relative p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <input
                type="number"
                placeholder="0.0"
                value={amountA}
                onChange={(e) => handleAmountAChange(e.target.value)}
                className="flex-1 bg-transparent text-2xl font-semibold text-gray-900 dark:text-white placeholder-gray-400 border-none outline-none"
                disabled={isLoading}
              />
              <TokenSelector
                selectedToken={tokenA}
                onTokenSelect={setTokenA}
                excludeToken={tokenB}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center mb-4">
          <button
            onClick={handleSwapTokens}
            disabled={isLoading}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <ArrowsUpDownIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Token Input B */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To</label>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Balance: 0.00
            </div>
          </div>
          <div className="relative p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <input
                type="number"
                placeholder="0.0"
                value={amountB}
                onChange={(e) => handleAmountBChange(e.target.value)}
                className="flex-1 bg-transparent text-2xl font-semibold text-gray-900 dark:text-white placeholder-gray-400 border-none outline-none"
                disabled={isLoading}
              />
              <TokenSelector
                selectedToken={tokenB}
                onTokenSelect={setTokenB}
                excludeToken={tokenA}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Exchange Rate & Price Impact */}
        {exchangeRate && tokenA && tokenB && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">Rate:</span>
              <span className="font-medium text-gray-900 dark:text-white">{exchangeRate}</span>
            </div>
            {priceImpact > 0 && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-700 dark:text-gray-300">Price Impact:</span>
                <span className={cn(
                  "font-medium",
                  priceImpact > 5 ? "text-red-600 dark:text-red-400" :
                  priceImpact > 2 ? "text-yellow-600 dark:text-yellow-400" :
                  "text-green-600 dark:text-green-400"
                )}>
                  {formatPercent(priceImpact)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Price Impact Warning */}
        {priceImpact > 5 && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <InformationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 dark:text-red-300">
                <strong>High price impact!</strong> You will lose a significant portion of your funds due to price impact.
              </div>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!canSwap}
          className={cn(
            "w-full py-4 rounded-xl font-semibold text-lg transition-all",
            canSwap
              ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
              : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          )}
        >
          {getSwapButtonText()}
        </button>

        {/* Transaction Details */}
        {canSwap && (
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Slippage Tolerance:</span>
              <span>{formatPercent(slippage)}</span>
            </div>
            <div className="flex justify-between">
              <span>Minimum Received:</span>
              <span>
                {tokenB && formatTokenAmount(parseFloat(amountB) * (1 - slippage / 100))} {tokenB.symbol}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
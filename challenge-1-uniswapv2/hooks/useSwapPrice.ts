import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Token } from '@/lib/tokens';
import { CONTRACTS } from '@/lib/web3';

const UNISWAP_V2_PAIR_ABI = [
  'function getReserves() view returns (uint112, uint112, uint32)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
];

const UNISWAP_V2_FACTORY_ABI = [
  'function getPair(address, address) view returns (address)',
];

export function useSwapPrice(fromToken: Token, toToken: Token, fromAmount: string) {
  const [toAmount, setToAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fromAmount || !fromToken || !toToken || fromToken.symbol === toToken.symbol) {
      setToAmount('');
      return;
    }

    const calculatePrice = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // For PAS ↔ WETH swaps, use 1:1 wrap/unwrap rate
        if ((fromToken.isNative && toToken.symbol === 'WETH') || 
            (fromToken.symbol === 'WETH' && toToken.isNative)) {
          // 1:1 wrap/unwrap rate for PAS ↔ WETH
          setToAmount(fromAmount);
          setIsLoading(false);
          return;
        }

        // For ERC20 tokens, try to get real pair data
        const provider = new ethers.JsonRpcProvider('https://testnet-passet-hub-eth-rpc.polkadot.io/');
        const factory = new ethers.Contract(CONTRACTS.UNISWAP_V2_FACTORY, UNISWAP_V2_FACTORY_ABI, provider);
        
        // Get pair address
        const pairAddress = await factory.getPair(fromToken.address, toToken.address);
        
        if (pairAddress === ethers.ZeroAddress) {
          // No pair exists, use mock rate
          const mockRate = 1.0; // 1:1 for demo
          const result = (parseFloat(fromAmount) * mockRate).toFixed(6);
          setToAmount(result);
        } else {
          // Pair exists, get reserves
          const pair = new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
          const [reserve0, reserve1] = await pair.getReserves();
          const token0 = await pair.token0();
          
          // Determine which reserve corresponds to which token
          const isToken0FromToken = token0.toLowerCase() === fromToken.address.toLowerCase();
          const fromReserve = isToken0FromToken ? reserve0 : reserve1;
          const toReserve = isToken0FromToken ? reserve1 : reserve0;
          
          if (fromReserve > 0 && toReserve > 0) {
            // Calculate price using constant product formula
            const fromAmountWei = ethers.parseUnits(fromAmount, fromToken.decimals);
            const numerator = fromAmountWei * toReserve;
            const denominator = fromReserve + fromAmountWei;
            const toAmountWei = numerator / denominator;
            const result = ethers.formatUnits(toAmountWei, toToken.decimals);
            setToAmount(parseFloat(result).toFixed(6));
          } else {
            // Empty reserves, use 1:1 rate
            setToAmount(fromAmount);
          }
        }
      } catch (err) {
        console.error('Price calculation error:', err);
        setError('Failed to calculate price');
        // Fallback to simple rate
        const fallbackRate = 1.0;
        const result = (parseFloat(fromAmount) * fallbackRate).toFixed(6);
        setToAmount(result);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(calculatePrice, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [fromToken, toToken, fromAmount]);

  return { toAmount, isLoading, error };
} 
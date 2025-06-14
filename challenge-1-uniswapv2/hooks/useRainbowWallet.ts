'use client';

import { useState } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Token } from '@/lib/tokens';
import { CONTRACTS, ERC20_ABI, WETH_ABI } from '@/lib/web3';

export function useRainbowWallet() {
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  
  const isCorrectNetwork = chain?.id === 420420422; // Paseo Asset Hub

  const switchToCorrectNetwork = () => {
    switchChain({ chainId: 420420422 });
  };

  return {
    address,
    isConnected,
    isCorrectNetwork,
    switchToCorrectNetwork,
    chainId: chain?.id,
  };
}

export function useTokenBalance(token: Token, address?: string) {
  const { data: balance, isLoading, refetch } = useBalance({
    address: address as `0x${string}`,
    token: token.isNative ? undefined : token.address as `0x${string}`,
  });

  return {
    balance: balance ? formatUnits(balance.value, balance.decimals) : '0',
    symbol: balance?.symbol || token.symbol,
    isLoading,
    refetch,
  };
}

export function useSwapTransaction() {
  const [swapError, setSwapError] = useState<string | null>(null);
  
  const { writeContract, isPending: isWritePending, error: writeError, data: hash } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const swap = async (
    tokenA: Token,
    tokenB: Token,
    amountIn: string,
    amountOutMin: string,
    to: string
  ) => {
    setSwapError(null);

    try {
      // Case 1: PAS → WETH (Wrap)
      if (tokenA.isNative && tokenB.symbol === 'WETH') {
        console.log('Wrapping PAS to WETH:', amountIn);
        writeContract({
          address: CONTRACTS.WETH as `0x${string}`,
          abi: WETH_ABI,
          functionName: 'deposit',
          value: parseUnits(amountIn, 18),
        });
      }
      // Case 2: WETH → PAS (Unwrap)  
      else if (tokenA.symbol === 'WETH' && tokenB.isNative) {
        console.log('Unwrapping WETH to PAS:', amountIn);
        writeContract({
          address: CONTRACTS.WETH as `0x${string}`,
          abi: WETH_ABI,
          functionName: 'withdraw',
          args: [parseUnits(amountIn, 18)],
        });
      }
      else {
        throw new Error('Unsupported swap type');
      }

      return { success: true, txHash: 'pending' };
    } catch (error: any) {
      console.error('Swap error:', error);
      setSwapError(error?.message || 'Swap failed');
      return { success: false, error };
    }
  };

  return {
    swap,
    isSwapping: isWritePending || isConfirming,
    swapError: swapError || writeError?.message,
    txHash: hash,
    isConfirming,
    isConfirmed,
  };
} 
'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useSimpleWallet } from '@/components/SimpleWalletProvider';
import { useToast } from '@/components/Toast';
import { Token } from '@/lib/tokens';
import { CONTRACTS, WETH_ABI, ERC20_ABI } from '@/lib/web3';

export function useSimpleSwap() {
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { signer, provider } = useSimpleWallet();
  const { addToast } = useToast();

  const swap = async (
    tokenA: Token,
    tokenB: Token,
    amountIn: string,
    to: string
  ) => {
    if (!signer || !provider) {
      throw new Error('Wallet not connected');
    }

    setIsSwapping(true);
    setSwapError(null);
    setTxHash(null);

    // Show processing toast
    addToast({
      type: 'info',
      title: 'Processing Transaction',
      message: `${tokenA.symbol} → ${tokenB.symbol}`,
      duration: 3000
    });

    try {
      let tx;

      // Case 1: PAS → WETH (Wrap)
      if (tokenA.isNative && tokenB.symbol === 'WETH') {
        console.log('Wrapping PAS to WETH:', amountIn);
        const wethContract = new ethers.Contract(CONTRACTS.WETH, WETH_ABI, signer);
        tx = await wethContract.deposit({
          value: ethers.parseEther(amountIn),
        });
      }
      // Case 2: WETH → PAS (Unwrap)  
      else if (tokenA.symbol === 'WETH' && tokenB.isNative) {
        console.log('Unwrapping WETH to PAS:', amountIn);
        const wethContract = new ethers.Contract(CONTRACTS.WETH, WETH_ABI, signer);
        tx = await wethContract.withdraw(ethers.parseEther(amountIn));
      }
      else {
        throw new Error('Unsupported swap type');
      }

      setTxHash(tx.hash);
      console.log('Transaction sent:', tx.hash);
      
      // Show confirming toast
      addToast({
        type: 'info',
        title: 'Transaction Submitted',
        message: 'Waiting for confirmation...',
        txHash: tx.hash,
        duration: 8000
      });
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      setIsSwapping(false);
      
      // Show success toast
      addToast({
        type: 'success',
        title: 'Transaction Successful!',
        message: `Swapped ${amountIn} ${tokenA.symbol} → ${tokenB.symbol}`,
        txHash: tx.hash,
        duration: 8000
      });
      
      return { success: true, txHash: tx.hash };
    } catch (error: any) {
      console.error('Swap error:', error);
      setSwapError(error?.message || 'Swap failed');
      setIsSwapping(false);
      
      // Show error toast
      addToast({
        type: 'error',
        title: 'Transaction Failed',
        message: error?.message || 'An unexpected error occurred',
        duration: 8000
      });
      
      return { success: false, error };
    }
  };

  return {
    swap,
    isSwapping,
    swapError,
    txHash,
  };
}

export function useTokenBalance(token: Token, address?: string) {
  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const { provider } = useSimpleWallet();

  const fetchBalance = async () => {
    if (!provider || !address) return;

    setIsLoading(true);
    try {
      if (token.isNative) {
        const balance = await provider.getBalance(address);
        setBalance(ethers.formatEther(balance));
      } else {
        const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
        const balance = await tokenContract.balanceOf(address);
        setBalance(ethers.formatUnits(balance, token.decimals));
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance('0');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    balance,
    isLoading,
    refetch: fetchBalance,
  };
} 
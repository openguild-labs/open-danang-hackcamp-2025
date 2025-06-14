import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance, useReadContract, useWriteContract, useSwitchChain } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { parseEther, formatEther, formatUnits, parseUnits } from 'viem'
import { ERC20_ABI, UNISWAP_V2_FACTORY_ABI, UNISWAP_V2_PAIR_ABI, CONTRACTS, paseoAssetHub } from '@/lib/web3'
import { Token } from '@/lib/tokens'

export function useWallet() {
  const { address, isConnected, chain } = useAccount()
  const { connect, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const connectWallet = () => {
    connect({ connector: injected() })
  }

  const switchToCorrectNetwork = () => {
    switchChain({ chainId: paseoAssetHub.id })
  }

  const isCorrectNetwork = chain?.id === paseoAssetHub.id

  return {
    address,
    isConnected,
    isCorrectNetwork,
    connectWallet,
    disconnect,
    switchToCorrectNetwork,
    isSwitching,
    connectError,
    chainId: chain?.id,
  }
}

export function useTokenBalance(token: Token, address?: string) {
  const { data: balance, isLoading, refetch } = useBalance({
    address: address as `0x${string}`,
    token: token.isNative ? undefined : token.address as `0x${string}`,
  })

  return {
    balance: balance ? formatUnits(balance.value, balance.decimals) : '0',
    symbol: balance?.symbol || token.symbol,
    isLoading,
    refetch,
  }
}

export function useTokenInfo(tokenAddress: string) {
  const { data: symbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'symbol',
  })

  const { data: name } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'name',
  })

  const { data: decimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })

  return {
    symbol: symbol as string,
    name: name as string,
    decimals: decimals as number,
  }
}

export function useTokenAllowance(token: Token, owner?: string, spender?: string) {
  const { data: allowance, refetch } = useReadContract({
    address: token.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [owner as `0x${string}`, spender as `0x${string}`],
    query: {
      enabled: !!owner && !!spender && !token.isNative,
    }
  })

  return {
    allowance: allowance ? formatUnits(allowance as bigint, token.decimals) : '0',
    refetch,
  }
}

export function useApproveToken(token: Token) {
  const { writeContract, isPending, error } = useWriteContract()

  const approve = (spender: string, amount: string) => {
    if (token.isNative) return Promise.resolve()
    
    writeContract({
      address: token.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender as `0x${string}`, parseUnits(amount, token.decimals)],
    })
  }

  return {
    approve,
    isPending,
    error,
  }
}

export function usePairAddress(tokenA: Token, tokenB: Token) {
  const { data: pairAddress } = useReadContract({
    address: CONTRACTS.UNISWAP_V2_FACTORY as `0x${string}`,
    abi: UNISWAP_V2_FACTORY_ABI,
    functionName: 'getPair',
    args: [tokenA.address as `0x${string}`, tokenB.address as `0x${string}`],
  })

  return {
    pairAddress: pairAddress as string,
    exists: pairAddress !== '0x0000000000000000000000000000000000000000',
  }
}

export function useSwap() {
  const [isSwapping, setIsSwapping] = useState(false)
  const [swapError, setSwapError] = useState<string | null>(null)
  const { writeContract } = useWriteContract()

  const swap = async (
    tokenA: Token,
    tokenB: Token,
    amountIn: string,
    amountOutMin: string,
    to: string
  ) => {
    setIsSwapping(true)
    setSwapError(null)

    try {
      // Case 1: PAS → WETH (Wrap)
      if (tokenA.isNative && tokenB.symbol === 'WETH') {
        console.log('Wrapping PAS to WETH:', amountIn)
        writeContract({
          address: CONTRACTS.WETH as `0x${string}`,
          abi: [
            'function deposit() payable',
          ],
          functionName: 'deposit',
          value: parseUnits(amountIn, 18),
        })
      }
      // Case 2: WETH → PAS (Unwrap)  
      else if (tokenA.symbol === 'WETH' && tokenB.isNative) {
        console.log('Unwrapping WETH to PAS:', amountIn)
        writeContract({
          address: CONTRACTS.WETH as `0x${string}`,
          abi: [
            'function withdraw(uint256) external',
          ],
          functionName: 'withdraw',
          args: [parseUnits(amountIn, 18)],
        })
      }
      // Case 3: ERC20 ↔ ERC20 (Not supported yet - need Router)
      else if (!tokenA.isNative && !tokenB.isNative) {
        throw new Error('ERC20 to ERC20 swaps not yet supported. Please create liquidity pools first.')
      }
      else {
        throw new Error('Unsupported swap type')
      }
      
      setIsSwapping(false)
      return { success: true, txHash: 'pending' }
    } catch (error) {
      console.error('Swap error:', error)
      setSwapError(error instanceof Error ? error.message : 'Swap failed')
      setIsSwapping(false)
      return { success: false, error }
    }
  }

  return {
    swap,
    isSwapping,
    swapError,
  }
}

export function useCreatePair() {
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const { writeContract } = useWriteContract()

  const createPair = async (tokenA: Token, tokenB: Token) => {
    setIsCreating(true)
    setCreateError(null)

    try {
      writeContract({
        address: CONTRACTS.UNISWAP_V2_FACTORY as `0x${string}`,
        abi: UNISWAP_V2_FACTORY_ABI,
        functionName: 'createPair',
        args: [tokenA.address as `0x${string}`, tokenB.address as `0x${string}`],
      })

      setIsCreating(false)
      return { success: true }
    } catch (error) {
      console.error('Create pair error:', error)
      setCreateError(error instanceof Error ? error.message : 'Failed to create pair')
      setIsCreating(false)
      return { success: false, error }
    }
  }

  return {
    createPair,
    isCreating,
    createError,
  }
} 
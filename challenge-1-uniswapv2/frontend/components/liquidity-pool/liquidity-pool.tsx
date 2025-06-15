"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, TrendingUp, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PoolCard } from "./pool-card"
import { PoolStats } from "./pool-stats"
import { useRouter } from "next/navigation"
import { useConfig, useReadContract, useReadContracts } from "wagmi"
import { contractAddresses } from "@/lib/contractAddresses"
import { uniswapV2FactoryAbi, uniswapV2PairAbi, erc20Abi } from "@/lib/abi"
import { Address, getAddress } from "viem"
import { useAtomValue } from "jotai"
import { addressAtom } from "../sigpasskit"
import { useAccount } from "wagmi"
import { localConfig } from "@/app/providers"

export interface Pool {
    id: string
    pairAddress: string
    tokenA: {
        symbol: string
        name: string
        address: string
        logoUrl?: string
    }
    tokenB: {
        symbol: string
        name: string
        address: string
        logoUrl?: string
    }
    liquidity: string
    volume24h: string
    fees24h: string
    apr: string
    userLiquidity?: string
    userShare?: string
}

export function LiquidityPoolComponent() {
    const [activeTab, setActiveTab] = useState("all")
    const [pools, setPools] = useState<Pool[]>([])
    const router = useRouter()
    const config = useConfig()
    const address = useAtomValue(addressAtom)
    const { address: wagmiAddress } = useAccount()

    const currentAddress = address || wagmiAddress
    const currentConfig = address ? localConfig : config

    // Get total number of pairs
    const { data: allPairsLength } = useReadContract({
        config: currentConfig,
        address: getAddress(contractAddresses.UNISWAP_V2_FACTORY) as Address,
        abi: uniswapV2FactoryAbi,
        functionName: "allPairsLength",
        args: [],
    })

    // Get all pair addresses (for demo, we'll fetch first 5 pairs)
    const pairQueries = useMemo(() => {
        const length = Math.min(Number(allPairsLength || 0), 5)
        return Array.from({ length }, (_, i) => ({
            address: getAddress(contractAddresses.UNISWAP_V2_FACTORY),
            abi: uniswapV2FactoryAbi,
            functionName: "allPairs",
            args: [BigInt(i)],
        }))
    }, [allPairsLength])

    const { data: pairAddresses, isLoading: isPairsLoading } = useReadContracts({
        config: currentConfig,
        contracts: pairQueries as any[],
        query: {
            enabled: !!allPairsLength && Number(allPairsLength) > 0,
        }
    })

    // Get valid pair addresses
    const validPairAddresses = useMemo(() => {
        if (!pairAddresses) return []
        return pairAddresses
            .filter(result => result.status === 'success')
            .map(result => getAddress(result.result as string))
    }, [pairAddresses])

    // Get pair data for all valid pairs
    const pairDataQueries = useMemo(() => {
        return validPairAddresses.flatMap(pairAddress => [
            {
                address: pairAddress,
                abi: uniswapV2PairAbi,
                functionName: 'token0',
                args: [],
            },
            {
                address: pairAddress,
                abi: uniswapV2PairAbi,
                functionName: 'token1',
                args: [],
            },
            {
                address: pairAddress,
                abi: uniswapV2PairAbi,
                functionName: 'getReserves',
                args: [],
            },
            {
                address: pairAddress,
                abi: uniswapV2PairAbi,
                functionName: 'totalSupply',
                args: [],
            },
            // User balance if wallet connected
            ...(currentAddress ? [{
                address: pairAddress,
                abi: uniswapV2PairAbi,
                functionName: 'balanceOf',
                args: [currentAddress],
            }] : [])
        ])
    }, [validPairAddresses, currentAddress])

    const { data: pairData, isLoading: isPairDataLoading } = useReadContracts({
        config: currentConfig,
        contracts: pairDataQueries as any[],
        query: {
            enabled: validPairAddresses.length > 0,
        }
    })

    // Get all unique token addresses
    const tokenAddresses = useMemo(() => {
        if (!pairData) return []

        const contractsPerPair = currentAddress ? 5 : 4
        const tokens = new Set<string>()

        validPairAddresses.forEach((_, pairIndex) => {
            const baseIndex = pairIndex * contractsPerPair
            const token0Result = pairData[baseIndex]
            const token1Result = pairData[baseIndex + 1]

            if (token0Result?.status === 'success') {
                tokens.add(token0Result.result as string)
            }
            if (token1Result?.status === 'success') {
                tokens.add(token1Result.result as string)
            }
        })

        return Array.from(tokens)
    }, [pairData, validPairAddresses, currentAddress])

    // Get token info for all tokens
    const tokenDataQueries = useMemo(() => {
        return tokenAddresses.flatMap(tokenAddress => [
            {
                address: getAddress(tokenAddress),
                abi: erc20Abi,
                functionName: 'symbol',
                args: [],
            },
            {
                address: getAddress(tokenAddress),
                abi: erc20Abi,
                functionName: 'name',
                args: [],
            }
        ])
    }, [tokenAddresses])

    const { data: tokenData, isLoading: isTokenDataLoading } = useReadContracts({
        config: currentConfig,
        contracts: tokenDataQueries as any[],
        query: {
            enabled: tokenAddresses.length > 0,
        }
    })

    // Process all data into pools
    useEffect(() => {
        if (!pairData || !tokenData || isPairDataLoading || isTokenDataLoading) return

        const processedPools: Pool[] = []
        const contractsPerPair = currentAddress ? 5 : 4

        validPairAddresses.forEach((pairAddress, pairIndex) => {
            const baseIndex = pairIndex * contractsPerPair

            // Get pair data
            const token0Result = pairData[baseIndex]
            const token1Result = pairData[baseIndex + 1]
            const reservesResult = pairData[baseIndex + 2]
            const totalSupplyResult = pairData[baseIndex + 3]
            const userBalanceResult = currentAddress ? pairData[baseIndex + 4] : null

            if (
                token0Result?.status !== 'success' ||
                token1Result?.status !== 'success' ||
                reservesResult?.status !== 'success' ||
                totalSupplyResult?.status !== 'success'
            ) return

            const token0Address = token0Result.result as string
            const token1Address = token1Result.result as string
            const reserves = reservesResult.result as [bigint, bigint, number]
            const totalSupply = totalSupplyResult.result as bigint

            // Find token data
            const token0Index = tokenAddresses.findIndex(addr =>
                getAddress(addr).toLowerCase() === getAddress(token0Address).toLowerCase()
            )
            const token1Index = tokenAddresses.findIndex(addr =>
                getAddress(addr).toLowerCase() === getAddress(token1Address).toLowerCase()
            )

            if (token0Index === -1 || token1Index === -1) return

            const token0SymbolResult = tokenData[token0Index * 2]
            const token0NameResult = tokenData[token0Index * 2 + 1]
            const token1SymbolResult = tokenData[token1Index * 2]
            const token1NameResult = tokenData[token1Index * 2 + 1]

            if (
                token0SymbolResult?.status !== 'success' ||
                token0NameResult?.status !== 'success' ||
                token1SymbolResult?.status !== 'success' ||
                token1NameResult?.status !== 'success'
            ) return

            // Calculate metrics
            const reserve0 = Number(reserves[0]) / 1e18
            const reserve1 = Number(reserves[1]) / 1e18
            const totalLiquidity = (reserve0 + reserve1) * 1000 // Simplified calculation

            const pool: Pool = {
                id: pairIndex.toString(),
                pairAddress: pairAddress,
                tokenA: {
                    symbol: token0SymbolResult.result as string,
                    name: token0NameResult.result as string,
                    address: token0Address,
                },
                tokenB: {
                    symbol: token1SymbolResult.result as string,
                    name: token1NameResult.result as string,
                    address: token1Address,
                },
                liquidity: totalLiquidity.toFixed(2),
                volume24h: (totalLiquidity * 0.1).toFixed(2), // Mock 24h volume
                fees24h: (totalLiquidity * 0.003).toFixed(2), // Mock fees
                apr: "12.5", // Mock APR
            }

            // Add user liquidity if available
            if (userBalanceResult?.status === 'success' && totalSupply as bigint > BigInt(0)) {
                const userBalance = userBalanceResult.result as bigint
                if (userBalance as bigint > BigInt(0)) {
                    const userShare = Number(userBalance) / Number(totalSupply) * 100
                    const userLiquidityValue = totalLiquidity * (userShare / 100)

                    pool.userLiquidity = userLiquidityValue.toFixed(2)
                    pool.userShare = userShare.toFixed(4)
                }
            }

            processedPools.push(pool)
        })

        setPools(processedPools)
    }, [pairData, tokenData, validPairAddresses, tokenAddresses, currentAddress, isPairDataLoading, isTokenDataLoading])

    const userPools = pools.filter(pool => pool.userLiquidity)

    const totalStats = {
        totalLiquidity: pools.reduce((sum, pool) => sum + parseFloat(pool.liquidity), 0).toFixed(2),
        volume24h: pools.reduce((sum, pool) => sum + parseFloat(pool.volume24h), 0).toFixed(2),
        fees24h: pools.reduce((sum, pool) => sum + parseFloat(pool.fees24h), 0).toFixed(2),
        poolCount: pools.length
    }

    const handleCreatePool = () => {
        router.push("/liquidity-pool/create-liquidity-pool")
    }

    const isLoading = isPairsLoading || isPairDataLoading || isTokenDataLoading

    if (isLoading) {
        return (
            <div className="w-full max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Liquidity Pools</h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Provide liquidity and earn fees from trades
                        </p>
                    </div>
                    <Button onClick={handleCreatePool} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create Pool
                    </Button>
                </div>

                <Card className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading liquidity pools...</p>
                </Card>
            </div>
        )
    }

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Liquidity Pools</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Provide liquidity and earn fees from trades
                    </p>
                </div>
                <Button onClick={handleCreatePool} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Pool
                </Button>
            </div>

            {/* Stats Overview */}
            <PoolStats stats={totalStats} />

            {/* Pool Management Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="all">All Pools ({pools.length})</TabsTrigger>
                    <TabsTrigger value="my">My Positions ({userPools.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {pools.length > 0 ? (
                        <div className="grid gap-4">
                            {pools.map((pool) => (
                                <PoolCard key={pool.id} pool={pool} />
                            ))}
                        </div>
                    ) : (
                        <Card className="p-8 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <TrendingUp className="h-8 w-8 text-gray-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        No liquidity pools found
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        Be the first to create a liquidity pool
                                    </p>
                                    <Button onClick={handleCreatePool}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Pool
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="my" className="space-y-4">
                    {userPools.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {userPools.length} positions
                                </span>
                                <Button variant="outline" size="sm">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View on Explorer
                                </Button>
                            </div>

                            <div className="grid gap-4">
                                {userPools.map((pool) => (
                                    <PoolCard key={pool.id} pool={pool} showUserPosition />
                                ))}
                            </div>
                        </>
                    ) : (
                        <Card className="p-8 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <TrendingUp className="h-8 w-8 text-gray-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        No liquidity positions
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        Create your first liquidity position to start earning fees
                                    </p>
                                    <Button onClick={handleCreatePool}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Position
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

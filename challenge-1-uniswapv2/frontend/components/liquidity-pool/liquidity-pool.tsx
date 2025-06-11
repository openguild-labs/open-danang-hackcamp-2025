"use client"

import { useState } from "react"
import { Plus, TrendingUp, DollarSign, Percent, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PoolCard } from "./pool-card"
import { PoolStats } from "./pool-stats"
import { useRouter } from "next/navigation"

export interface Pool {
    id: string
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

const mockPools: Pool[] = [
    {
        id: "1",
        tokenA: { symbol: "ETH", name: "Ethereum", address: "0x..." },
        tokenB: { symbol: "USDC", name: "USD Coin", address: "0x..." },
        liquidity: "45,234,567.89",
        volume24h: "2,345,678.90",
        fees24h: "7,037.04",
        apr: "12.45",
        userLiquidity: "1,234.56",
        userShare: "0.0027"
    },
    {
        id: "2",
        tokenA: { symbol: "USDC", name: "USD Coin", address: "0x..." },
        tokenB: { symbol: "USDT", name: "Tether", address: "0x..." },
        liquidity: "23,456,789.12",
        volume24h: "1,234,567.89",
        fees24h: "3,703.70",
        apr: "8.92",
    },
    {
        id: "3",
        tokenA: { symbol: "ETH", name: "Ethereum", address: "0x..." },
        tokenB: { symbol: "DAI", name: "Dai Stablecoin", address: "0x..." },
        liquidity: "12,345,678.90",
        volume24h: "987,654.32",
        fees24h: "2,962.96",
        apr: "15.67",
        userLiquidity: "567.89",
        userShare: "0.0046"
    }
]

export function LiquidityPoolComponent() {
    const [activeTab, setActiveTab] = useState("all")
    const router = useRouter()

    const userPools = mockPools.filter(pool => pool.userLiquidity)

    const totalStats = {
        totalLiquidity: "81,037,035.91",
        volume24h: "4,567,901.11",
        fees24h: "13,703.70",
        poolCount: mockPools.length
    }

    const handleCreatePool = () => {
        router.push("/liquidity-pool/create-liquidity-pool")
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
                    <TabsTrigger value="all">All Pools</TabsTrigger>
                    <TabsTrigger value="my">My Positions ({userPools.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {mockPools.length} pools
                            </span>
                            <Badge variant="secondary" className="text-xs">
                                Updated 2m ago
                            </Badge>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {mockPools.map((pool) => (
                            <PoolCard key={pool.id} pool={pool} />
                        ))}
                    </div>
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

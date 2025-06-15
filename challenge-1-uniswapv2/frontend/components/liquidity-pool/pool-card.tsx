"use client"

import { TrendingUp, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pool } from "./liquidity-pool"

interface PoolCardProps {
    pool: Pool
    showUserPosition?: boolean
}

export function PoolCard({ pool, showUserPosition = false }: PoolCardProps) {
    const formatNumber = (num: string) => {
        const value = parseFloat(num)
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(2)}M`
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(2)}K`
        }
        return `$${value.toFixed(2)}`
    }

    const formatPercent = (num: string) => {
        return `${parseFloat(num).toFixed(2)}%`
    }

    return (
        <Card className="hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-800">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    {/* Pool Info */}
                    <div className="flex items-center gap-4">
                        {/* Token Pair Icons */}
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                {pool.tokenA.symbol.charAt(0)}
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg -ml-3 border-2 border-white dark:border-gray-900">
                                {pool.tokenB.symbol.charAt(0)}
                            </div>
                        </div>

                        {/* Pool Details */}
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {pool.tokenA.symbol}/{pool.tokenB.symbol}
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                    0.3%
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {pool.tokenA.name} • {pool.tokenB.name}
                            </p>
                        </div>
                    </div>

                    {/* Pool Stats */}
                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Liquidity</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatNumber(pool.liquidity)}
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Volume 24H</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatNumber(pool.volume24h)}
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">APR</p>
                            <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <p className="text-lg font-semibold text-green-600">
                                    {formatPercent(pool.apr)}
                                </p>
                            </div>
                        </div>

                        {showUserPosition && pool.userLiquidity && (
                            <div className="text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">My Liquidity</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {formatNumber(pool.userLiquidity)}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {pool.userShare}% of pool
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {showUserPosition && pool.userLiquidity ? (
                                <>
                                    <Button variant="outline" size="sm">
                                        <Minus className="h-4 w-4 mr-1" />
                                        Remove
                                    </Button>
                                    <Button size="sm">
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add
                                    </Button>
                                </>
                            ) : (
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Liquidity
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Additional Pool Info */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-6">
                            <span className="text-gray-600 dark:text-gray-400">
                                24H Fees: <span className="text-gray-900 dark:text-white font-medium">
                                    {formatNumber(pool.fees24h)}
                                </span>
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                                Pool ID: <span className="text-gray-900 dark:text-white font-mono">
                                    {pool.id}
                                </span>
                            </span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                            View Details
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

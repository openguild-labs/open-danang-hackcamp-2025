import { DollarSign, TrendingUp, Percent, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PoolStatsProps {
    stats: {
        totalLiquidity: string
        volume24h: string
        fees24h: string
        poolCount: number
    }
}

export function PoolStats({ stats }: PoolStatsProps) {
    const formatNumber = (num: string) => {
        const value = parseFloat(num)
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(2)}M`
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(2)}K`
        }
        return `$${value.toFixed(2)}`
    }

    const statItems = [
        {
            title: "Total Liquidity",
            value: formatNumber(stats.totalLiquidity),
            icon: DollarSign,
            color: "text-blue-600",
            bgColor: "bg-blue-100 dark:bg-blue-900/20"
        },
        {
            title: "24H Volume",
            value: formatNumber(stats.volume24h),
            icon: TrendingUp,
            color: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-900/20"
        },
        {
            title: "24H Fees",
            value: formatNumber(stats.fees24h),
            icon: Percent,
            color: "text-purple-600",
            bgColor: "bg-purple-100 dark:bg-purple-900/20"
        },
        {
            title: "Total Pools",
            value: stats.poolCount.toString(),
            icon: BarChart3,
            color: "text-orange-600",
            bgColor: "bg-orange-100 dark:bg-orange-900/20"
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statItems.map((item, index) => (
                <Card key={index} className="border border-gray-200 dark:border-gray-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {item.title}
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {item.value}
                                </p>
                            </div>
                            <div className={`w-12 h-12 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                                <item.icon className={`h-6 w-6 ${item.color}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

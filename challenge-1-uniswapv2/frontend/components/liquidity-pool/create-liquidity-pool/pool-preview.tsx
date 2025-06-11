import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Token } from "./create-liquidity-pool"

interface PoolPreviewProps {
    tokenA: Token
    tokenB: Token
    amountA: string
    amountB: string
    feeRate: string
}

export function PoolPreview({
    tokenA,
    tokenB,
    amountA,
    amountB,
    feeRate
}: PoolPreviewProps) {
    const priceAPerB = parseFloat(amountB) / parseFloat(amountA)
    const priceBPerA = parseFloat(amountA) / parseFloat(amountB)

    const totalValueA = parseFloat(amountA) * parseFloat(tokenA.price || "0")
    const totalValueB = parseFloat(amountB) * parseFloat(tokenB.price || "0")
    const totalValue = totalValueA + totalValueB

    const sharePercentage = 100 // First liquidity provider gets 100%

    return (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
                <CardTitle className="text-lg">Pool Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Pool Composition */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {tokenA.symbol} Deposited
                        </span>
                        <span className="font-medium">
                            {amountA} {tokenA.symbol}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {tokenB.symbol} Deposited
                        </span>
                        <span className="font-medium">
                            {amountB} {tokenB.symbol}
                        </span>
                    </div>
                </div>

                <Separator />

                {/* Price Information */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            1 {tokenA.symbol} =
                        </span>
                        <span className="font-medium">
                            {priceAPerB.toFixed(6)} {tokenB.symbol}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            1 {tokenB.symbol} =
                        </span>
                        <span className="font-medium">
                            {priceBPerA.toFixed(6)} {tokenA.symbol}
                        </span>
                    </div>
                </div>

                <Separator />

                {/* Pool Details */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Total Value
                        </span>
                        <span className="font-medium">
                            ${totalValue.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Fee Rate
                        </span>
                        <span className="font-medium">
                            {feeRate}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Your Pool Share
                        </span>
                        <span className="font-medium text-green-600">
                            {sharePercentage}%
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

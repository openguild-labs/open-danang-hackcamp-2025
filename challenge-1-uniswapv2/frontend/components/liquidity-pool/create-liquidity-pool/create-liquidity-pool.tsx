"use client"

import { useState } from "react"
import { ArrowLeft, Plus, Info, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { TokenPairSelector } from "./token-pair-selector"
import { LiquidityInput } from "./liquidity-input"
import { PoolPreview } from "./pool-preview"

export interface Token {
    symbol: string
    name: string
    address: string
    logoUrl?: string
    balance?: string
    price?: string
}

const availableTokens: Token[] = [
    { symbol: "ETH", name: "Ethereum", address: "0x...", balance: "1.234", price: "2,500.00" },
    { symbol: "USDC", name: "USD Coin", address: "0x...", balance: "1000.00", price: "1.00" },
    { symbol: "USDT", name: "Tether", address: "0x...", balance: "500.00", price: "1.00" },
    { symbol: "DAI", name: "Dai Stablecoin", address: "0x...", balance: "250.50", price: "1.00" },
    { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x...", balance: "0.05", price: "45,000.00" },
]

export function CreateLiquidityPoolComponent() {
    const router = useRouter()
    const [tokenA, setTokenA] = useState<Token | null>(null)
    const [tokenB, setTokenB] = useState<Token | null>(null)
    const [amountA, setAmountA] = useState<string>("")
    const [amountB, setAmountB] = useState<string>("")
    const [isCreating, setIsCreating] = useState(false)
    const [feeRate] = useState("0.3") // Default fee rate

    const handleBack = () => {
        router.back()
    }

    const handleCreatePool = async () => {
        if (!tokenA || !tokenB || !amountA || !amountB) return

        setIsCreating(true)
        // Simulate pool creation
        await new Promise(resolve => setTimeout(resolve, 3000))
        setIsCreating(false)

        // Navigate back to pools page
        router.push("/liquidity-pool")
    }

    const isFormValid = tokenA && tokenB && amountA && amountB &&
        parseFloat(amountA) > 0 && parseFloat(amountB) > 0

    const poolExists = tokenA && tokenB &&
        ((tokenA.symbol === "ETH" && tokenB.symbol === "USDC") ||
            (tokenA.symbol === "USDC" && tokenB.symbol === "ETH"))

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="h-8 w-8 p-0"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Create Liquidity Pool
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Add liquidity to earn trading fees
                    </p>
                </div>
            </div>

            {/* Pool Creation Form */}
            <Card className="border border-gray-200 dark:border-gray-800">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Select Pair</span>
                        <Badge variant="secondary">Fee: {feeRate}%</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Token Pair Selection */}
                    <TokenPairSelector
                        tokenA={tokenA}
                        tokenB={tokenB}
                        onTokenASelect={setTokenA}
                        onTokenBSelect={setTokenB}
                        availableTokens={availableTokens}
                    />

                    {/* Pool Exists Warning */}
                    {poolExists && (
                        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800 dark:text-orange-200">
                                A pool for this pair already exists. You can add liquidity to the existing pool instead.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Liquidity Inputs */}
                    {tokenA && tokenB && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Info className="h-4 w-4 text-blue-600" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Set the initial price by providing both tokens
                                </span>
                            </div>

                            <LiquidityInput
                                label="Amount A"
                                token={tokenA}
                                amount={amountA}
                                onAmountChange={setAmountA}
                            />

                            <div className="flex justify-center">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <Plus className="h-4 w-4 text-gray-600" />
                                </div>
                            </div>

                            <LiquidityInput
                                label="Amount B"
                                token={tokenB}
                                amount={amountB}
                                onAmountChange={setAmountB}
                            />
                        </div>
                    )}

                    {/* Pool Preview */}
                    {tokenA && tokenB && amountA && amountB && (
                        <PoolPreview
                            tokenA={tokenA}
                            tokenB={tokenB}
                            amountA={amountA}
                            amountB={amountB}
                            feeRate={feeRate}
                        />
                    )}

                    {/* Create Pool Button */}
                    <Button
                        onClick={handleCreatePool}
                        disabled={!isFormValid || isCreating}
                        className="w-full h-12 text-lg font-medium"
                    >
                        {isCreating ? "Creating Pool..." : poolExists ? "Add to Existing Pool" : "Create Pool"}
                    </Button>

                    {/* Important Notes */}
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-2">
                                <p className="font-medium">Important:</p>
                                <ul className="text-sm space-y-1 ml-4 list-disc">
                                    <li>You will be the first liquidity provider for this pool</li>
                                    <li>The initial price will be set based on your token ratio</li>
                                    <li>You will receive LP tokens representing your share</li>
                                    <li>You can remove liquidity at any time</li>
                                </ul>
                            </div>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    )
}

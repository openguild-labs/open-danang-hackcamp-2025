"use client"

import { useState } from "react"
import { ArrowDownUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TokenInput } from "./token-input"
import { SwapSettings } from "./swap-settings"

export interface Token {
    symbol: string
    name: string
    address: string
    logoUrl?: string
    balance?: string
}

const defaultTokens: Token[] = [
    { symbol: "ETH", name: "Ethereum", address: "0x...", balance: "1.234" },
    { symbol: "USDC", name: "USD Coin", address: "0x...", balance: "1000.00" },
    { symbol: "USDT", name: "Tether", address: "0x...", balance: "500.00" },
    { symbol: "DAI", name: "Dai Stablecoin", address: "0x...", balance: "250.50" },
]

export function SwapComponent() {
    const [fromToken, setFromToken] = useState<Token>(defaultTokens[0])
    const [toToken, setToToken] = useState<Token>(defaultTokens[1])
    const [fromAmount, setFromAmount] = useState<string>("")
    const [toAmount, setToAmount] = useState<string>("")
    const [isSwapping, setIsSwapping] = useState(false)

    const handleSwapTokens = () => {
        const tempToken = fromToken
        const tempAmount = fromAmount
        setFromToken(toToken)
        setToToken(tempToken)
        setFromAmount(toAmount)
        setToAmount(tempAmount)
    }

    const handleSwap = async () => {
        setIsSwapping(true)
        // Simulate swap process
        await new Promise(resolve => setTimeout(resolve, 2000))
        setIsSwapping(false)
        // Handle actual swap logic here
    }

    const isSwapDisabled = !fromAmount || !toAmount || fromAmount === "0"

    return (
        <div className="w-full max-w-md mx-auto">
            <Card className="p-4 space-y-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Swap</h2>
                    <SwapSettings />
                </div>

                {/* From Token */}
                <TokenInput
                    label="From"
                    token={fromToken}
                    amount={fromAmount}
                    onTokenSelect={setFromToken}
                    onAmountChange={setFromAmount}
                    tokens={defaultTokens}
                    showBalance
                />

                {/* Swap Button */}
                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSwapTokens}
                        className="h-8 w-8 p-0 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <ArrowDownUp className="h-4 w-4" />
                    </Button>
                </div>

                {/* To Token */}
                <TokenInput
                    label="To"
                    token={toToken}
                    amount={toAmount}
                    onTokenSelect={setToToken}
                    onAmountChange={setToAmount}
                    tokens={defaultTokens}
                    readOnly
                />

                {/* Price Info */}
                {fromAmount && toAmount && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        1 {fromToken.symbol} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken.symbol}
                    </div>
                )}

                {/* Swap Button */}
                <Button
                    onClick={handleSwap}
                    disabled={isSwapDisabled || isSwapping}
                    className="w-full h-12 text-lg font-medium"
                >
                    {isSwapping ? "Swapping..." : isSwapDisabled ? "Enter an amount" : "Swap"}
                </Button>
            </Card>
        </div>
    )
}

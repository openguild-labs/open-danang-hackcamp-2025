"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Token } from "./create-liquidity-pool"

interface LiquidityInputProps {
    label: string
    token: Token
    amount: string
    onAmountChange: (amount: string) => void
}

export function LiquidityInput({
    label,
    token,
    amount,
    onAmountChange
}: LiquidityInputProps) {
    const handleMaxClick = () => {
        if (token.balance) {
            onAmountChange(token.balance)
        }
    }

    const totalValue = amount && token.price ?
        (parseFloat(amount) * parseFloat(token.price)).toFixed(2) : "0.00"

    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </Label>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <Input
                        type="number"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => onAmountChange(e.target.value)}
                        className="text-xl font-medium bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {token.symbol.charAt(0)}
                        </div>
                        <span className="font-medium">{token.symbol}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        ≈ ${totalValue}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                            Balance: {token.balance} {token.symbol}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMaxClick}
                            className="h-6 px-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            MAX
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

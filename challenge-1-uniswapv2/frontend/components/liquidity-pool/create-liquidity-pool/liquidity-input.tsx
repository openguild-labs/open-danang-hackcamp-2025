"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Token } from "./create-liquidity-pool"
import { useReadContracts } from "wagmi"
import { erc20Abi } from "@/lib/abi"
import { Address } from "viem"
import { useAtomValue } from "jotai"
import { addressAtom } from "../../sigpasskit"
import { useAccount } from "wagmi"
import { localConfig } from "@/app/providers"
import { useConfig } from "wagmi"

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
    const config = useConfig()
    const address = useAtomValue(addressAtom)
    const { address: wagmiAddress } = useAccount()
    const [tokenBalance, setTokenBalance] = useState("0")

    const currentAddress = address || wagmiAddress
    const currentConfig = address ? localConfig : config

    // Get token balance
    const { data: tokenData } = useReadContracts({
        config: currentConfig,
        contracts: [
            {
                abi: erc20Abi,
                address: token.address as Address,
                functionName: 'balanceOf',
                args: [currentAddress as Address],
            },
            {
                abi: erc20Abi,
                address: token.address as Address,
                functionName: 'decimals',
                args: [],
            }
        ],
        query: {
            enabled: !!token.address && !!currentAddress,
        }
    })

    // Update token balance when data is available
    useEffect(() => {
        if (tokenData && tokenData[0]?.status === 'success' && tokenData[1]?.status === 'success') {
            const balance = tokenData[0].result as bigint
            const decimals = tokenData[1].result as number

            if (balance !== undefined && decimals !== undefined) {
                const balanceNumber = Number(balance) / Math.pow(10, decimals)
                setTokenBalance(balanceNumber.toString())
            }
        }
    }, [tokenData])

    const handleMaxClick = () => {
        if (tokenBalance && parseFloat(tokenBalance) > 0) {
            onAmountChange(tokenBalance)
        }
    }

    const formatBalance = (balance: string) => {
        const num = parseFloat(balance)
        if (num === 0) return "0"
        if (num < 0.0001) return "< 0.0001"
        if (num < 1) return num.toFixed(6)
        if (num < 1000) return num.toFixed(4)
        if (num < 1000000) return (num / 1000).toFixed(2) + "K"
        return (num / 1000000).toFixed(2) + "M"
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
                            Balance: {formatBalance(tokenBalance)} {token.symbol}
                        </span>
                        {parseFloat(tokenBalance) > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMaxClick}
                                className="h-6 px-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                MAX
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

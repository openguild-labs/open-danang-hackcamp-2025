"use client"

import { useState, useEffect } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useReadContracts } from "wagmi"
import { erc20Abi } from "@/lib/abi"
import { Address, isAddress } from "viem"
import { Token } from "./create-liquidity-pool"

interface TokenListItemProps {
    token: Token
    onClick: () => void
    currentAddress: string | undefined
    config: any
    onCopyAddress: (address: string, e: React.MouseEvent) => void
    copiedAddress: string | null
    searchQuery: string
    searchTokenData?: any
    getSearchTokenBalance: () => string
}

export function TokenListItem({
    token,
    onClick,
    currentAddress,
    config,
    onCopyAddress,
    copiedAddress,
    searchQuery,
    searchTokenData,
    getSearchTokenBalance
}: TokenListItemProps) {
    const [displayToken, setDisplayToken] = useState(token)

    // Get token data from contract for default tokens
    const { data: tokenData } = useReadContracts({
        config,
        contracts: [
            {
                abi: erc20Abi,
                address: token.address as Address,
                functionName: 'symbol',
                args: [],
            },
            {
                abi: erc20Abi,
                address: token.address as Address,
                functionName: 'name',
                args: [],
            },
            {
                abi: erc20Abi,
                address: token.address as Address,
                functionName: 'decimals',
                args: [],
            },
            {
                abi: erc20Abi,
                address: token.address as Address,
                functionName: 'balanceOf',
                args: [currentAddress as Address],
            }
        ],
        query: {
            enabled: !!token.address && !isAddress(searchQuery) && !!currentAddress,
        }
    })

    // Update display token when contract data is available
    useEffect(() => {
        if (tokenData && tokenData[0]?.status === 'success' && tokenData[1]?.status === 'success') {
            setDisplayToken({
                ...token,
                symbol: tokenData[0].result as string,
                name: tokenData[1].result as string,
            })
        }
    }, [tokenData, token])

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`
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

    const formatBalanceFromWei = (balanceWei: bigint, decimals: number = 18) => {
        try {
            if (!balanceWei || !decimals) return "0"
            const balance = Number(balanceWei) / Math.pow(10, decimals)
            return formatBalance(balance.toString())
        } catch (error) {
            console.error("Error formatting balance:", error)
            return "0"
        }
    }

    // Get balance for token
    const getTokenBalance = () => {
        try {
            if (isAddress(searchQuery) && searchTokenData) {
                // Use balance from search token data
                return getSearchTokenBalance()
            } else if (tokenData) {
                // Use balance from default token data
                const balanceResult = tokenData[3]
                const decimalsResult = tokenData[2]

                if (balanceResult?.status === 'success' && decimalsResult?.status === 'success') {
                    const balance = balanceResult.result as bigint
                    const decimals = decimalsResult.result as number

                    if (balance === undefined || decimals === undefined) return "0"

                    return formatBalanceFromWei(balance, decimals)
                }
            }
            return "0"
        } catch (error) {
            console.error("Error getting token balance:", error)
            return "0"
        }
    }

    return (
        <Button
            variant="ghost"
            onClick={onClick}
            className="w-full justify-start p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-800"
        >
            <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {displayToken.symbol.charAt(0)}
                </div>
                <div className="flex-1 text-left">
                    <div className="font-medium">{displayToken.symbol}</div>
                    <div className="text-sm text-gray-500">{displayToken.name}</div>
                    {isAddress(searchQuery) && (
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-gray-400 font-mono">
                                {formatAddress(token.address)}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => onCopyAddress(token.address, e)}
                                className="h-4 w-4 p-0 hover:bg-transparent"
                            >
                                {copiedAddress === token.address ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                    <Copy className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                                )}
                            </Button>
                        </div>
                    )}
                </div>
                {currentAddress && (
                    <div className="text-right">
                        <div className="text-sm font-medium">{getTokenBalance()}</div>
                        <div className="text-xs text-gray-500">Balance</div>
                    </div>
                )}
            </div>
        </Button>
    )
}

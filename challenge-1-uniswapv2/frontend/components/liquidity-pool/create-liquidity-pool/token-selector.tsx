"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { ChevronDown, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useReadContracts } from "wagmi"
import { erc20Abi } from "@/lib/abi"
import { Address, isAddress } from "viem"
import { Token } from "./create-liquidity-pool"
import { TokenListItem } from "./token-list-item"

interface TokenSelectorProps {
    label: string
    selectedToken: Token | null
    onSelect: (token: Token) => void
    availableTokens: Token[]
    dialogKey: 'A' | 'B'
    openDialog: 'A' | 'B' | null
    setOpenDialog: (dialog: 'A' | 'B' | null) => void
    currentAddress: string | undefined
    currentConfig: any
    handleCopyAddress: (address: string, e: React.MouseEvent) => void
    copiedAddress: string | null
}

export function TokenSelector({
    label,
    selectedToken,
    onSelect,
    availableTokens,
    dialogKey,
    openDialog,
    setOpenDialog,
    currentAddress,
    currentConfig,
    handleCopyAddress,
    copiedAddress
}: TokenSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("")

    // Check if this dialog should be open
    const isDialogOpen = openDialog === dialogKey

    // Reset search when dialog closes
    useEffect(() => {
        if (!isDialogOpen) {
            setSearchQuery("")
        }
    }, [isDialogOpen])

    // Get search token data from contract
    const { data: searchTokenData, isLoading: isSearchTokenDataLoading, isFetching: isSearchTokenDataFetching } = useReadContracts({
        config: currentConfig,
        contracts: [
            {
                abi: erc20Abi,
                address: searchQuery as Address,
                functionName: 'symbol',
                args: [],
            },
            {
                abi: erc20Abi,
                address: searchQuery as Address,
                functionName: 'name',
                args: [],
            },
            {
                abi: erc20Abi,
                address: searchQuery as Address,
                functionName: 'decimals',
                args: [],
            },
            {
                abi: erc20Abi,
                address: searchQuery as Address,
                functionName: 'balanceOf',
                args: [currentAddress as Address],
            }
        ],
        query: {
            enabled: !!searchQuery && isAddress(searchQuery) && !!currentAddress,
        }
    })

    // Calculate filtered tokens using useMemo to prevent unnecessary re-renders
    const filteredTokens = useMemo(() => {
        if (searchQuery === "") {
            return availableTokens
        } else if (isAddress(searchQuery)) {
            if (searchTokenData && searchTokenData[0]?.status === 'success' && searchTokenData[1]?.status === 'success') {
                const searchedToken: Token = {
                    symbol: searchTokenData[0].result as string,
                    name: searchTokenData[1].result as string,
                    address: searchQuery,
                    balance: "0",
                    price: "0"
                }

                const existingToken = availableTokens.find(t => t.address.toLowerCase() === searchQuery.toLowerCase())
                return existingToken ? [existingToken] : [searchedToken]
            } else if (isSearchTokenDataLoading || isSearchTokenDataFetching) {
                return []
            } else {
                return []
            }
        } else {
            return availableTokens.filter((t) => {
                const query = searchQuery.toLowerCase()
                return (
                    t.symbol.toLowerCase().includes(query) ||
                    t.name.toLowerCase().includes(query)
                )
            })
        }
    }, [searchQuery, availableTokens, searchTokenData, isSearchTokenDataLoading, isSearchTokenDataFetching])

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

    const getSearchTokenBalance = () => {
        try {
            if (isAddress(searchQuery) && searchTokenData) {
                const balanceResult = searchTokenData[3]
                const decimalsResult = searchTokenData[2]

                if (balanceResult?.status === 'success' && decimalsResult?.status === 'success') {
                    const balance = balanceResult.result as bigint
                    const decimals = decimalsResult.result as number

                    if (balance === undefined || decimals === undefined) return "0"

                    return formatBalanceFromWei(balance, decimals)
                }
            }
            return "0"
        } catch (error) {
            console.error("Error getting search token balance:", error)
            return "0"
        }
    }

    const handleTokenSelectLocal = useCallback((token: Token) => {
        onSelect(token)
        // Close the dialog immediately after selection
        setOpenDialog(null)
        // Clear search query
        setSearchQuery("")
    }, [onSelect, setOpenDialog])

    const handleDialogOpenChange = useCallback((open: boolean) => {
        if (open) {
            setOpenDialog(dialogKey)
        } else {
            setOpenDialog(null)
        }
    }, [dialogKey, setOpenDialog])

    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value)
    }, [])

    const handleClearSearch = useCallback(() => {
        setSearchQuery("")
    }, [])

    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </Label>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full h-14 justify-between bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    >
                        {selectedToken ? (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                                    {selectedToken.symbol.charAt(0)}
                                </div>
                                <div className="text-left">
                                    <div className="font-medium">{selectedToken.symbol}</div>
                                    <div className="text-sm text-gray-500">{selectedToken.name}</div>
                                </div>
                            </div>
                        ) : (
                            <span className="text-gray-500">Select token</span>
                        )}
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DialogTrigger>

                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select {label}</DialogTitle>
                    </DialogHeader>

                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by name, symbol, or address"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-10 pr-10"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearSearch}
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Address Search Hint */}
                    {searchQuery && isAddress(searchQuery) && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 px-2">
                            💡 Searching by contract address
                            {(isSearchTokenDataLoading || isSearchTokenDataFetching) && (
                                <span className="ml-2">⌛ Loading token data...</span>
                            )}
                        </div>
                    )}

                    {/* Token List */}
                    <div className="max-h-80 overflow-y-auto space-y-1">
                        {(isSearchTokenDataLoading || isSearchTokenDataFetching) && isAddress(searchQuery) ? (
                            <div className="text-center py-8 text-gray-500">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                </div>
                                <p>Loading token data...</p>
                            </div>
                        ) : filteredTokens.length > 0 ? (
                            filteredTokens.map((token) => (
                                <TokenListItem
                                    key={token.address}
                                    token={token}
                                    onClick={() => handleTokenSelectLocal(token)}
                                    currentAddress={currentAddress}
                                    config={currentConfig}
                                    onCopyAddress={handleCopyAddress}
                                    copiedAddress={copiedAddress}
                                    searchQuery={searchQuery}
                                    searchTokenData={isAddress(searchQuery) ? searchTokenData : undefined}
                                    getSearchTokenBalance={getSearchTokenBalance}
                                />
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                                    <Search className="h-6 w-6" />
                                </div>
                                <p>No tokens found</p>
                                <p className="text-sm">
                                    {isAddress(searchQuery)
                                        ? "Token with this address not found or invalid"
                                        : "Try searching by name, symbol, or paste a contract address"
                                    }
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Popular Tokens Section (when no search) */}
                    {searchQuery === "" && (
                        <div className="border-t pt-4">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Popular Tokens
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {availableTokens.slice(0, 4).map((token) => (
                                    <Button
                                        key={token.address}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleTokenSelectLocal(token)}
                                        className="h-8"
                                    >
                                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold mr-2">
                                            {token.symbol.charAt(0)}
                                        </div>
                                        {token.symbol}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

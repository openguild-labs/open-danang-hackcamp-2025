"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Search, X, Copy, Check } from "lucide-react"
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
import { Token } from "./swap"
import { useConfig, useReadContracts } from "wagmi"
import { localConfig } from "@/app/providers"
import { erc20Abi } from "@/lib/abi"
import { Address, isAddress } from "viem"
import { useAtomValue } from "jotai"
import { addressAtom } from "../sigpasskit"
import { useAccount } from "wagmi"

interface TokenInputProps {
    label: string
    token: Token
    amount: string
    onTokenSelect: (token: Token) => void
    onAmountChange: (amount: string) => void
    tokens: Token[]
    showBalance?: boolean
    readOnly?: boolean
    isInput?: boolean
}

export function TokenInput({
    label,
    token,
    amount,
    onTokenSelect,
    onAmountChange,
    tokens,
    showBalance = false,
    readOnly = false,
    isInput = true,
}: TokenInputProps) {
    const config = useConfig()
    const address = useAtomValue(addressAtom)
    const { address: wagmiAddress } = useAccount()
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [displayToken, setDisplayToken] = useState(token)
    const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
    const [filteredTokens, setFilteredTokens] = useState<Token[]>(tokens)

    const currentAddress = address || wagmiAddress

    // Get token data from contract
    const { data: tokenData } = useReadContracts({
        config: address ? localConfig : config,
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
            enabled: !!token.address && !!currentAddress,
        }
    })

    const { data: searchTokenData, isLoading: isSearchTokenDataLoading, refetch: searchTokenDataRefetch, isFetching: isSearchTokenDataFetching } = useReadContracts({
        config: address ? localConfig : config,
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
            }, {
                abi: erc20Abi,
                address: searchQuery as Address,
                functionName: 'balanceOf',
                args: [currentAddress as Address],
            }
        ],
        query: {
            enabled: !!searchQuery && isAddress(searchQuery),
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

    // Update filtered tokens based on search query
    useEffect(() => {
        if (searchQuery === "") {
            // Show default tokens when no search
            setFilteredTokens(tokens)
        } else if (isAddress(searchQuery)) {
            // When searching by address, check if we have search results
            if (searchTokenData && searchTokenData[0]?.status === 'success' && searchTokenData[1]?.status === 'success') {
                // Create token from search results with balance data
                const searchedToken: Token = {
                    symbol: searchTokenData[0].result as string,
                    name: searchTokenData[1].result as string,
                    address: searchQuery,
                }

                // Check if token already exists in default list
                const existingToken = tokens.find(t => t.address.toLowerCase() === searchQuery.toLowerCase())
                if (existingToken) {
                    setFilteredTokens([existingToken])
                } else {
                    setFilteredTokens([searchedToken])
                }
            } else if (isSearchTokenDataLoading || isSearchTokenDataFetching) {
                // Show loading state for address search
                setFilteredTokens([])
            } else {
                // No results found for the address
                setFilteredTokens([])
            }
        } else {
            // Filter default tokens by name/symbol
            const filtered = tokens.filter((t) => {
                const query = searchQuery.toLowerCase()
                return (
                    t.symbol.toLowerCase().includes(query) ||
                    t.name.toLowerCase().includes(query)
                )
            })
            setFilteredTokens(filtered)
        }
    }, [searchQuery, tokens, searchTokenData, isSearchTokenDataLoading, isSearchTokenDataFetching])

    const handleTokenSelect = (selectedToken: Token) => {
        onTokenSelect(selectedToken)
        setIsOpen(false)
        setSearchQuery("")
    }

    const handleCopyAddress = async (tokenAddress: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await navigator.clipboard.writeText(tokenAddress)
            setCopiedAddress(tokenAddress)
            setTimeout(() => setCopiedAddress(null), 2000)
        } catch (err) {
            console.error('Failed to copy address:', err)
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

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`
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

    const getCurrentTokenBalance = () => {
        try {
            if (tokenData && tokenData[3]?.status === 'success' && tokenData[2]?.status === 'success') {
                const balance = tokenData[3].result as bigint
                const decimals = tokenData[2].result as number

                if (balance === undefined || decimals === undefined) return "0"

                return formatBalanceFromWei(balance, decimals)
            }
            return "0"
        } catch (error) {
            console.error("Error getting token balance:", error)
            return "0"
        }
    }

    const getCurrentTokenBalanceRaw = () => {
        try {
            if (tokenData && tokenData[3]?.status === 'success' && tokenData[2]?.status === 'success') {
                const balance = tokenData[3].result as bigint
                const decimals = tokenData[2].result as number

                if (balance === undefined || decimals === undefined) return "0"

                const balanceNumber = Number(balance) / Math.pow(10, decimals)
                return balanceNumber.toString()
            }
            return "0"
        } catch (error) {
            console.error("Error getting raw token balance:", error)
            return "0"
        }
    }

    const handleMaxClick = () => {
        const rawBalance = getCurrentTokenBalanceRaw()
        if (rawBalance !== "0") {
            onAmountChange(rawBalance)
        }
    }

    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </Label>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <Input
                        type="number"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => onAmountChange(e.target.value)}
                        className="text-2xl font-medium bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                        readOnly={readOnly}
                    />

                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-10 px-3 font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                        {displayToken.symbol.charAt(0)}
                                    </div>
                                    <span>{displayToken.symbol}</span>
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Select Token</DialogTitle>
                            </DialogHeader>

                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name, symbol, or address"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-10"
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSearchQuery("")}
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
                                    filteredTokens.map((t) => (
                                        <TokenListItem
                                            key={t.address}
                                            token={t}
                                            onClick={() => handleTokenSelect(t)}
                                            currentAddress={currentAddress}
                                            config={address ? localConfig : config}
                                            onCopyAddress={handleCopyAddress}
                                            copiedAddress={copiedAddress}
                                            searchQuery={searchQuery}
                                            searchTokenData={isAddress(searchQuery) ? searchTokenData : undefined}
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
                                        {tokens.slice(0, 4).map((t) => (
                                            <Button
                                                key={t.address}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleTokenSelect(t)}
                                                className="h-8"
                                            >
                                                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold mr-2">
                                                    {t.symbol.charAt(0)}
                                                </div>
                                                {t.symbol}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>

                {showBalance && currentAddress && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                            Balance: {getCurrentTokenBalance()} {displayToken.symbol}
                        </span>
                        {getCurrentTokenBalanceRaw() !== "0" && parseFloat(getCurrentTokenBalanceRaw()) > 0 && (
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
                )}
            </div>
        </div>
    )
}

// Separate component for token list items to handle individual token data
function TokenListItem({
    token,
    onClick,
    currentAddress,
    config,
    onCopyAddress,
    copiedAddress,
    searchQuery,
    searchTokenData
}: {
    token: Token
    onClick: () => void
    currentAddress: string | undefined
    config: any
    onCopyAddress: (address: string, e: React.MouseEvent) => void
    copiedAddress: string | null
    searchQuery: string
    searchTokenData?: any
}) {
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

    const formatBalance = (balance: string) => {
        const num = parseFloat(balance)
        if (num === 0) return "0"
        if (num < 0.0001) return "< 0.0001"
        if (num < 1) return num.toFixed(6)
        if (num < 1000) return num.toFixed(4)
        if (num < 1000000) return (num / 1000).toFixed(2) + "K"
        return (num / 1000000).toFixed(2) + "M"
    }

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`
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

    // Get balance for searched token
    const getTokenBalance = () => {
        try {
            if (isAddress(searchQuery) && searchTokenData) {
                // Use balance from search token data
                const balanceResult = searchTokenData[3] // balanceOf is the 4th contract call
                const decimalsResult = searchTokenData[2] // decimals is the 3rd contract call

                if (balanceResult?.status === 'success' && decimalsResult?.status === 'success') {
                    const balance = balanceResult.result as bigint
                    const decimals = decimalsResult.result as number

                    if (balance === undefined || decimals === undefined) return "0"

                    return formatBalanceFromWei(balance, decimals)
                }
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

    const hasBalance = () => {
        try {
            if (isAddress(searchQuery) && searchTokenData) {
                const balanceResult = searchTokenData[3]
                return balanceResult?.status === 'success' && (balanceResult.result as bigint) > 0n
            } else if (tokenData) {
                const balanceResult = tokenData[3]
                return balanceResult?.status === 'success' && (balanceResult.result as bigint) > 0n
            }
            return false
        } catch (error) {
            console.error("Error checking balance:", error)
            return false
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

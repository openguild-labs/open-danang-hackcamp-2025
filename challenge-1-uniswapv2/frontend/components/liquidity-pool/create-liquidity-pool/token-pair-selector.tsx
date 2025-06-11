"use client"

import { useState } from "react"
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
import { Token } from "./create-liquidity-pool"

interface TokenPairSelectorProps {
    tokenA: Token | null
    tokenB: Token | null
    onTokenASelect: (token: Token) => void
    onTokenBSelect: (token: Token) => void
    availableTokens: Token[]
}

export function TokenPairSelector({
    tokenA,
    tokenB,
    onTokenASelect,
    onTokenBSelect,
    availableTokens
}: TokenPairSelectorProps) {
    const [openDialog, setOpenDialog] = useState<'A' | 'B' | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    const getAvailableTokensForA = () => {
        return availableTokens.filter(token => !tokenB || token.address !== tokenB.address)
    }

    const getAvailableTokensForB = () => {
        return availableTokens.filter(token => !tokenA || token.address !== tokenA.address)
    }

    const handleTokenSelect = (token: Token, type: 'A' | 'B') => {
        if (type === 'A') {
            onTokenASelect(token)
        } else {
            onTokenBSelect(token)
        }
        setOpenDialog(null)
        setSearchQuery("")
    }

    const TokenSelector = ({
        label,
        selectedToken,
        onSelect,
        availableTokens,
        dialogKey
    }: {
        label: string
        selectedToken: Token | null
        onSelect: (token: Token) => void
        availableTokens: Token[]
        dialogKey: 'A' | 'B'
    }) => {
        const filteredTokens = availableTokens.filter((t) =>
            searchQuery === ""
                ? true
                : t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.name.toLowerCase().includes(searchQuery.toLowerCase())
        )

        return (
            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </Label>

                <Dialog open={openDialog === dialogKey} onOpenChange={(open) => setOpenDialog(open ? dialogKey : null)}>
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
                                placeholder="Search by name or symbol"
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

                        {/* Token List */}
                        <div className="max-h-80 overflow-y-auto space-y-1">
                            {filteredTokens.length > 0 ? (
                                filteredTokens.map((token) => (
                                    <Button
                                        key={token.address}
                                        variant="ghost"
                                        onClick={() => handleTokenSelect(token, dialogKey)}
                                        className="w-full justify-start p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                {token.symbol.charAt(0)}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="font-medium">{token.symbol}</div>
                                                <div className="text-sm text-gray-500">{token.name}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium">{token.balance}</div>
                                                <div className="text-xs text-gray-500">${token.price}</div>
                                            </div>
                                        </div>
                                    </Button>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                                        <Search className="h-6 w-6" />
                                    </div>
                                    <p>No tokens found</p>
                                    <p className="text-sm">Try adjusting your search</p>
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
                                            onClick={() => handleTokenSelect(token, dialogKey)}
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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TokenSelector
                label="Token A"
                selectedToken={tokenA}
                onSelect={onTokenASelect}
                availableTokens={getAvailableTokensForA()}
                dialogKey="A"
            />

            <TokenSelector
                label="Token B"
                selectedToken={tokenB}
                onSelect={onTokenBSelect}
                availableTokens={getAvailableTokensForB()}
                dialogKey="B"
            />
        </div>
    )
}

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
import { Token } from "./swap"

interface TokenInputProps {
    label: string
    token: Token
    amount: string
    onTokenSelect: (token: Token) => void
    onAmountChange: (amount: string) => void
    tokens: Token[]
    showBalance?: boolean
    readOnly?: boolean
}

export function TokenInput({
    label,
    token,
    amount,
    onTokenSelect,
    onAmountChange,
    tokens,
    showBalance = false,
    readOnly = false
}: TokenInputProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const handleMaxClick = () => {
        if (token.balance) {
            onAmountChange(token.balance)
        }
    }

    const handleTokenSelect = (selectedToken: Token) => {
        onTokenSelect(selectedToken)
        setIsOpen(false)
        setSearchQuery("")
    }

    const filteredTokens = tokens.filter((t) =>
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
                                        {token.symbol.charAt(0)}
                                    </div>
                                    <span>{token.symbol}</span>
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
                                    filteredTokens.map((t) => (
                                        <Button
                                            key={t.address}
                                            variant="ghost"
                                            onClick={() => handleTokenSelect(t)}
                                            className="w-full justify-start p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                    {t.symbol.charAt(0)}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="font-medium">{t.symbol}</div>
                                                    <div className="text-sm text-gray-500">{t.name}</div>
                                                </div>
                                                {t.balance && (
                                                    <div className="text-right">
                                                        <div className="text-sm font-medium">{t.balance}</div>
                                                        <div className="text-xs text-gray-500">Balance</div>
                                                    </div>
                                                )}
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

                {showBalance && token.balance && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Balance: {token.balance} {token.symbol}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMaxClick}
                            className="h-6 px-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            MAX
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

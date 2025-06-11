"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
    const [openDropdown, setOpenDropdown] = useState<'A' | 'B' | null>(null)

    const getAvailableTokensForA = () => {
        return availableTokens.filter(token => !tokenB || token.address !== tokenB.address)
    }

    const getAvailableTokensForB = () => {
        return availableTokens.filter(token => !tokenA || token.address !== tokenA.address)
    }

    const TokenSelector = ({
        label,
        selectedToken,
        onSelect,
        availableTokens,
        dropdownKey
    }: {
        label: string
        selectedToken: Token | null
        onSelect: (token: Token) => void
        availableTokens: Token[]
        dropdownKey: 'A' | 'B'
    }) => (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </Label>
            <DropdownMenu
                open={openDropdown === dropdownKey}
                onOpenChange={(open: boolean) => setOpenDropdown(open ? dropdownKey : null)}
            >
                <DropdownMenuTrigger asChild>
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
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[300px]">
                    {availableTokens.map((token) => (
                        <DropdownMenuItem
                            key={token.address}
                            onClick={() => {
                                onSelect(token)
                                setOpenDropdown(null)
                            }}
                            className="flex items-center gap-3 p-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                {token.symbol.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">{token.symbol}</div>
                                <div className="text-sm text-gray-500">{token.name}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium">{token.balance}</div>
                                <div className="text-xs text-gray-500">${token.price}</div>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TokenSelector
                label="Token A"
                selectedToken={tokenA}
                onSelect={onTokenASelect}
                availableTokens={getAvailableTokensForA()}
                dropdownKey="A"
            />

            <TokenSelector
                label="Token B"
                selectedToken={tokenB}
                onSelect={onTokenBSelect}
                availableTokens={getAvailableTokensForB()}
                dropdownKey="B"
            />
        </div>
    )
}

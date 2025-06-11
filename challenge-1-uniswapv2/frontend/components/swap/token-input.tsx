"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

    const handleMaxClick = () => {
        if (token.balance) {
            onAmountChange(token.balance)
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
                    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                        <DropdownMenuTrigger asChild>
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
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            {tokens.map((t) => (
                                <DropdownMenuItem
                                    key={t.address}
                                    onClick={() => {
                                        onTokenSelect(t)
                                        setIsOpen(false)
                                    }}
                                    className="flex items-center gap-3 p-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                                        {t.symbol.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium">{t.symbol}</div>
                                        <div className="text-sm text-gray-500">{t.name}</div>
                                    </div>
                                    {t.balance && (
                                        <div className="text-sm text-gray-500">{t.balance}</div>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
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

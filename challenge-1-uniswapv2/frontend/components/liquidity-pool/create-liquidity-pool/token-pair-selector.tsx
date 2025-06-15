"use client"

import { useState, useEffect } from "react"
import { Check, Copy, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Token } from "./create-liquidity-pool"
import { useConfig, useReadContract } from "wagmi"
import { contractAddresses } from "@/lib/contractAddresses"
import { uniswapV2FactoryAbi } from "@/lib/abi"
import { Address, getAddress } from "viem"
import { useAtomValue } from "jotai"
import { addressAtom } from "../../sigpasskit"
import { useAccount } from "wagmi"
import { localConfig } from "@/app/providers"
import { TokenSelector } from "./token-selector"

interface TokenPairSelectorProps {
    tokenA: Token | null
    tokenB: Token | null
    onTokenASelect: (token: Token) => void
    onTokenBSelect: (token: Token) => void
    availableTokens: Token[]
    onPairStatusChange: (exists: boolean, pairAddress: string | null) => void
}

export function TokenPairSelector({
    tokenA,
    tokenB,
    onTokenASelect,
    onTokenBSelect,
    availableTokens,
    onPairStatusChange
}: TokenPairSelectorProps) {
    const config = useConfig()
    const address = useAtomValue(addressAtom)
    const { address: wagmiAddress } = useAccount()
    const [openDialog, setOpenDialog] = useState<'A' | 'B' | null>(null)
    const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

    const currentAddress = address || wagmiAddress
    const currentConfig = address ? localConfig : config

    // Check if pair exists
    const { data: pairAddress, isLoading: isPairLoading } = useReadContract({
        config: currentConfig,
        address: getAddress(contractAddresses.UNISWAP_V2_FACTORY) as Address,
        abi: uniswapV2FactoryAbi,
        functionName: "getPair",
        args: tokenA && tokenB ? [
            getAddress(tokenA.address) as Address,
            getAddress(tokenB.address) as Address
        ] : undefined,
        query: {
            enabled: !!(tokenA && tokenB && tokenA.address !== tokenB.address),
        }
    })

    // Update parent component when pair status changes
    useEffect(() => {
        if (tokenA && tokenB && pairAddress !== undefined) {
            const exists = pairAddress !== "0x0000000000000000000000000000000000000000"
            onPairStatusChange(exists, exists ? pairAddress as string : null)
        } else {
            onPairStatusChange(false, null)
        }
    }, [pairAddress, tokenA, tokenB, onPairStatusChange])

    const getAvailableTokensForA = () => {
        return availableTokens.filter(token => !tokenB || token.address !== tokenB.address)
    }

    const getAvailableTokensForB = () => {
        return availableTokens.filter(token => !tokenA || token.address !== tokenA.address)
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

    // Pair status display
    const renderPairStatus = () => {
        if (!tokenA || !tokenB || tokenA.address === tokenB.address) return null

        if (isPairLoading) {
            return (
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                        Checking if pair exists...
                    </AlertDescription>
                </Alert>
            )
        }

        const pairExists = pairAddress !== "0x0000000000000000000000000000000000000000"

        if (pairExists) {
            return (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                        <div className="flex items-center justify-between">
                            <span>Pair exists! You can add liquidity.</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleCopyAddress(pairAddress as string, e)}
                                className="h-6 px-2"
                            >
                                {copiedAddress === pairAddress ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                    <Copy className="h-3 w-3" />
                                )}
                            </Button>
                        </div>
                        <div className="text-xs font-mono mt-1">
                            <span className="text-gray-500">
                                {`Pair address: ${pairAddress}`}
                            </span>
                        </div>
                    </AlertDescription>
                </Alert>
            )
        } else {
            return (
                <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800 dark:text-orange-200">
                        Pair doesn't exist. You'll create a new pool.
                    </AlertDescription>
                </Alert>
            )
        }
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TokenSelector
                    label="Token A"
                    selectedToken={tokenA}
                    onSelect={onTokenASelect}
                    availableTokens={getAvailableTokensForA()}
                    dialogKey="A"
                    openDialog={openDialog}
                    setOpenDialog={setOpenDialog}
                    currentAddress={currentAddress}
                    currentConfig={currentConfig}
                    handleCopyAddress={handleCopyAddress}
                    copiedAddress={copiedAddress}
                />

                <TokenSelector
                    label="Token B"
                    selectedToken={tokenB}
                    onSelect={onTokenBSelect}
                    availableTokens={getAvailableTokensForB()}
                    dialogKey="B"
                    openDialog={openDialog}
                    setOpenDialog={setOpenDialog}
                    currentAddress={currentAddress}
                    currentConfig={currentConfig}
                    handleCopyAddress={handleCopyAddress}
                    copiedAddress={copiedAddress}
                />
            </div>

            {renderPairStatus()}
        </div>
    )
}
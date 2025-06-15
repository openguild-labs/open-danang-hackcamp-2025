"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, Info, AlertTriangle, Check, X, Hash, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { TokenPairSelector } from "./token-pair-selector"
import { LiquidityInput } from "./liquidity-input"
import { PoolPreview } from "./pool-preview"
import { useConfig, useWriteContract, useWaitForTransactionReceipt, useReadContracts, useReadContract } from "wagmi"
import { contractAddresses } from "@/lib/contractAddresses"
import { uniswapV2FactoryAbi, uniswapV2PairAbi, erc20Abi } from "@/lib/abi"
import { Address, getAddress, parseUnits, BaseError } from "viem"
import { useAtomValue } from "jotai"
import { addressAtom } from "../../sigpasskit"
import { useAccount } from "wagmi"
import { localConfig } from "@/app/providers"
import { getSigpassWallet } from "@/lib/sigpass"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { getBlockExplorerUrl, truncateHash } from "@/lib/utils"
import CopyButton from "../../copy-button"

export interface Token {
    symbol: string
    name: string
    address: string
    logoUrl?: string
    balance?: string
    price?: string
}

const availableTokens: Token[] = [
    {
        symbol: "WETH",
        name: "Wrapped Ether",
        address: contractAddresses.WETH,
        balance: "0",
        price: "2500.00"
    },
    {
        symbol: "HARRY",
        name: "Harry Token",
        address: contractAddresses.HARRY_TOKEN,
        balance: "0",
        price: "1.00"
    },
]

export function CreateLiquidityPoolComponent() {
    const router = useRouter()
    const config = useConfig()
    const address = useAtomValue(addressAtom)
    const { address: wagmiAddress, chainId } = useAccount()
    const [tokenA, setTokenA] = useState<Token | null>(null)
    const [tokenB, setTokenB] = useState<Token | null>(null)
    const [amountA, setAmountA] = useState<string>("")
    const [amountB, setAmountB] = useState<string>("")
    const [feeRate] = useState("0.3")
    const [pairExists, setPairExists] = useState(false)
    const [pairAddress, setPairAddress] = useState<string | null>(null)
    const [currentStep, setCurrentStep] = useState<'idle' | 'creating' | 'transferA' | 'transferB' | 'minting' | 'success' | 'error'>('idle')
    const [showDialog, setShowDialog] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string>("")
    const [transactionHashes, setTransactionHashes] = useState<string[]>([])
    const [newPairAddress, setNewPairAddress] = useState<string | null>(null)

    const currentAddress = address || wagmiAddress
    const currentConfig = address ? localConfig : config

    const {
        data: hash,
        error: writeContractError,
        isPending,
        writeContractAsync,
        reset: resetWriteContract
    } = useWriteContract({
        config: currentConfig,
    })

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
        config: currentConfig,
    })

    // Get newly created pair address after creation
    const { data: newPairData, refetch: refetchPairAddress } = useReadContract({
        config: currentConfig,
        address: getAddress(contractAddresses.UNISWAP_V2_FACTORY) as Address,
        abi: uniswapV2FactoryAbi,
        functionName: "getPair",
        args: tokenA && tokenB ? [
            getAddress(tokenA.address) as Address,
            getAddress(tokenB.address) as Address
        ] : undefined,
        query: {
            enabled: false, // Only enable when we need to fetch
        }
    })

    // Get token balances
    const { data: tokenDataA } = useReadContracts({
        config: currentConfig,
        contracts: [
            {
                abi: erc20Abi,
                address: tokenA?.address as Address,
                functionName: 'balanceOf',
                args: [currentAddress as Address],
            },
            {
                abi: erc20Abi,
                address: tokenA?.address as Address,
                functionName: 'decimals',
                args: [],
            }
        ],
        query: {
            enabled: !!tokenA && !!currentAddress,
        }
    })

    const { data: tokenDataB } = useReadContracts({
        config: currentConfig,
        contracts: [
            {
                abi: erc20Abi,
                address: tokenB?.address as Address,
                functionName: 'balanceOf',
                args: [currentAddress as Address],
            },
            {
                abi: erc20Abi,
                address: tokenB?.address as Address,
                functionName: 'decimals',
                args: [],
            }
        ],
        query: {
            enabled: !!tokenB && !!currentAddress,
        }
    })

    useEffect(() => {
        if (hash) {
            setTransactionHashes(prev => [...prev, hash])
            setShowDialog(true)
        }
    }, [hash])

    useEffect(() => {
        if (isConfirmed && hash) {
            handleTransactionConfirmed()
        }
    }, [isConfirmed, hash, currentStep])

    const handleTransactionConfirmed = async () => {
        try {
            if (currentStep === 'creating') {
                // Pair created, get the new pair address
                console.log("Pair created, fetching new pair address...")
                const result = await refetchPairAddress()
                const fetchedPairAddress = result.data as string

                if (fetchedPairAddress && fetchedPairAddress !== "0x0000000000000000000000000000000000000000") {
                    setNewPairAddress(fetchedPairAddress)
                    console.log("New pair address:", fetchedPairAddress)

                    // Small delay to ensure state updates
                    setTimeout(() => {
                        handleTransferTokenA(fetchedPairAddress)
                    }, 1000)
                } else {
                    throw new Error("Failed to get new pair address")
                }
            } else if (currentStep === 'transferA') {
                // Token A transferred, now transfer token B
                setTimeout(() => {
                    handleTransferTokenB()
                }, 1000)
            } else if (currentStep === 'transferB') {
                // Token B transferred, now mint LP tokens
                setTimeout(() => {
                    handleMintLiquidity()
                }, 1000)
            } else if (currentStep === 'minting') {
                // All done
                setCurrentStep('success')
                setTimeout(() => {
                    router.push("/liquidity-pool")
                }, 3000)
            }
        } catch (error) {
            console.error("Error in transaction flow:", error)
            setCurrentStep('error')
            setErrorMessage("Failed to continue transaction flow")
        }
    }

    useEffect(() => {
        if (writeContractError) {
            setCurrentStep('error')
            setErrorMessage((writeContractError as BaseError).shortMessage || writeContractError.message)
        }
    }, [writeContractError])

    const handleBack = () => {
        router.back()
    }

    const handlePairStatusChange = (exists: boolean, address: string | null) => {
        setPairExists(exists)
        setPairAddress(address)
    }

    const handleCreatePair = async () => {
        if (!tokenA || !tokenB) return

        try {
            setCurrentStep('creating')
            setShowDialog(true)
            setTransactionHashes([])
            resetWriteContract()

            console.log("Creating pair for:", tokenA.symbol, "and", tokenB.symbol)

            await writeContractAsync({
                account: address ? await getSigpassWallet() : undefined,
                address: getAddress(contractAddresses.UNISWAP_V2_FACTORY),
                abi: uniswapV2FactoryAbi,
                functionName: 'createPair',
                args: [getAddress(tokenA.address), getAddress(tokenB.address)],
            })
        } catch (error) {
            console.error("Create pair failed:", error)
            setCurrentStep('error')
            setErrorMessage("Failed to create pair")
        }
    }

    const handleTransferTokenA = async (targetPairAddress?: string) => {
        if (!tokenA || !amountA || !tokenDataA) return

        const pairAddr = targetPairAddress || pairAddress || newPairAddress
        if (!pairAddr) {
            throw new Error("No pair address available")
        }

        try {
            setCurrentStep('transferA')
            resetWriteContract()

            const decimalsA = tokenDataA[1]?.result as number
            const amountAWei = parseUnits(amountA, decimalsA)

            console.log("Transferring", amountA, tokenA.symbol, "to pair:", pairAddr)

            await writeContractAsync({
                account: address ? await getSigpassWallet() : undefined,
                address: getAddress(tokenA.address),
                abi: erc20Abi,
                functionName: 'transfer',
                args: [getAddress(pairAddr), amountAWei],
            })
        } catch (error) {
            console.error("Transfer token A failed:", error)
            setCurrentStep('error')
            setErrorMessage("Failed to transfer " + tokenA.symbol)
        }
    }

    const handleTransferTokenB = async () => {
        if (!tokenB || !amountB || !tokenDataB) return

        const pairAddr = pairAddress || newPairAddress
        if (!pairAddr) {
            throw new Error("No pair address available")
        }

        try {
            setCurrentStep('transferB')
            resetWriteContract()

            const decimalsB = tokenDataB[1]?.result as number
            const amountBWei = parseUnits(amountB, decimalsB)

            console.log("Transferring", amountB, tokenB.symbol, "to pair:", pairAddr)

            await writeContractAsync({
                account: address ? await getSigpassWallet() : undefined,
                address: getAddress(tokenB.address),
                abi: erc20Abi,
                functionName: 'transfer',
                args: [getAddress(pairAddr), amountBWei],
            })
        } catch (error) {
            console.error("Transfer token B failed:", error)
            setCurrentStep('error')
            setErrorMessage("Failed to transfer " + tokenB.symbol)
        }
    }

    const handleMintLiquidity = async () => {
        if (!currentAddress) return

        const pairAddr = pairAddress || newPairAddress
        if (!pairAddr) {
            throw new Error("No pair address available")
        }

        try {
            setCurrentStep('minting')
            resetWriteContract()

            console.log("Minting LP tokens for pair:", pairAddr)

            await writeContractAsync({
                account: address ? await getSigpassWallet() : undefined,
                address: getAddress(pairAddr),
                abi: uniswapV2PairAbi,
                functionName: 'mint',
                args: [currentAddress as Address],
            })
        } catch (error) {
            console.error("Mint liquidity failed:", error)
            setCurrentStep('error')
            setErrorMessage("Failed to mint LP tokens")
        }
    }

    const handleAddLiquidityToExistingPool = async () => {
        if (!pairAddress) return

        try {
            setCurrentStep('transferA')
            setShowDialog(true)
            setTransactionHashes([])
            resetWriteContract()

            // For existing pools, start with transferring tokens
            await handleTransferTokenA()
        } catch (error) {
            console.error("Add liquidity failed:", error)
        }
    }

    const handleMainAction = async () => {
        if (!currentAddress || !tokenA || !tokenB || !amountA || !amountB) return

        try {
            if (pairExists && pairAddress) {
                // Pair exists, start with token transfers
                await handleAddLiquidityToExistingPool()
            } else {
                // Create new pair first
                await handleCreatePair()
            }
        } catch (error) {
            console.error("Main action failed:", error)
        }
    }

    const isFormValid = tokenA && tokenB && amountA && amountB &&
        parseFloat(amountA) > 0 && parseFloat(amountB) > 0 && currentAddress

    const getButtonText = () => {
        if (!currentAddress) return "Connect Wallet"
        if (!tokenA || !tokenB) return "Select Tokens"
        if (!amountA || !amountB) return "Enter Amounts"

        switch (currentStep) {
            case 'creating': return "Creating Pool..."
            case 'transferA': return "Transferring Token A..."
            case 'transferB': return "Transferring Token B..."
            case 'minting': return "Minting LP Tokens..."
            default:
                return pairExists ? "Add Liquidity" : "Create Pool & Add Liquidity"
        }
    }

    const getStepDescription = () => {
        switch (currentStep) {
            case 'creating': return "Creating new liquidity pool..."
            case 'transferA': return `Transferring ${tokenA?.symbol} to pool...`
            case 'transferB': return `Transferring ${tokenB?.symbol} to pool...`
            case 'minting': return "Minting LP tokens..."
            case 'success': return "Liquidity added successfully!"
            case 'error': return "Transaction failed"
            default: return ""
        }
    }

    const resetProcess = () => {
        setCurrentStep('idle')
        setTransactionHashes([])
        setNewPairAddress(null)
        setErrorMessage("")
        resetWriteContract()
        setShowDialog(false)
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="h-8 w-8 p-0"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Create Liquidity Pool
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Add liquidity to earn trading fees
                    </p>
                </div>
            </div>

            {/* Pool Creation Form */}
            <Card className="border border-gray-200 dark:border-gray-800">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Select Pair</span>
                        <Badge variant="secondary">Fee: {feeRate}%</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Token Pair Selection */}
                    <TokenPairSelector
                        tokenA={tokenA}
                        tokenB={tokenB}
                        onTokenASelect={setTokenA}
                        onTokenBSelect={setTokenB}
                        availableTokens={availableTokens}
                        onPairStatusChange={handlePairStatusChange}
                    />

                    {/* Liquidity Inputs */}
                    {tokenA && tokenB && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Info className="h-4 w-4 text-blue-600" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {pairExists
                                        ? "Add liquidity to existing pool"
                                        : "Set the initial price by providing both tokens"
                                    }
                                </span>
                            </div>

                            <LiquidityInput
                                label="Amount A"
                                token={tokenA}
                                amount={amountA}
                                onAmountChange={setAmountA}
                            />

                            <div className="flex justify-center">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <Plus className="h-4 w-4 text-gray-600" />
                                </div>
                            </div>

                            <LiquidityInput
                                label="Amount B"
                                token={tokenB}
                                amount={amountB}
                                onAmountChange={setAmountB}
                            />
                        </div>
                    )}

                    {/* Pool Preview */}
                    {tokenA && tokenB && amountA && amountB && (
                        <PoolPreview
                            tokenA={tokenA}
                            tokenB={tokenB}
                            amountA={amountA}
                            amountB={amountB}
                            feeRate={feeRate}
                        />
                    )}

                    {/* Action Button */}
                    <Button
                        onClick={handleMainAction}
                        disabled={!isFormValid || currentStep !== 'idle'}
                        className="w-full h-12 text-lg font-medium"
                    >
                        {getButtonText()}
                    </Button>

                    {/* Reset Button when there's an error */}
                    {currentStep === 'error' && (
                        <Button
                            onClick={resetProcess}
                            variant="outline"
                            className="w-full"
                        >
                            Try Again
                        </Button>
                    )}

                    {/* Important Notes */}
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-2">
                                <p className="font-medium">Process:</p>
                                <ul className="text-sm space-y-1 ml-4 list-disc">
                                    {!pairExists && <li>Create new trading pair</li>}
                                    <li>Transfer {tokenA?.symbol} to pair contract</li>
                                    <li>Transfer {tokenB?.symbol} to pair contract</li>
                                    <li>Mint LP tokens to your wallet</li>
                                    <li>Start earning 0.3% fees from trades</li>
                                </ul>
                            </div>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Transaction Status Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-md rounded-2xl border-2 border-indigo-200 dark:border-indigo-800">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                            Transaction Progress
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            {getStepDescription()}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 p-4 bg-indigo-50/80 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                        {/* Current Transaction Hash */}
                        {hash && (
                            <div className="flex flex-row gap-2 items-center p-3 bg-white/90 dark:bg-black/40 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                <Hash className="w-5 h-5 text-indigo-600" />
                                <span className="font-medium">Current TX:</span>
                                <a
                                    className="flex flex-row gap-2 items-center underline underline-offset-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                    href={`${getBlockExplorerUrl(currentConfig, chainId)}/tx/${hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {truncateHash(hash)}
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                <CopyButton copyText={hash} />
                            </div>
                        )}

                        {/* New Pair Address (if created) */}
                        {newPairAddress && (
                            <div className="flex flex-row gap-2 items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <Check className="w-5 h-5 text-green-600" />
                                <span className="font-medium">New Pair:</span>
                                <a
                                    className="flex flex-row gap-2 items-center underline underline-offset-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                    href={`${getBlockExplorerUrl(currentConfig, chainId)}/address/${newPairAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {truncateHash(newPairAddress)}
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                <CopyButton copyText={newPairAddress} />
                            </div>
                        )}

                        {/* Progress Steps */}
                        <div className="space-y-2">
                            {!pairExists && (
                                <div className={`flex items-center gap-2 p-2 rounded ${currentStep === 'creating' ? 'bg-blue-100 dark:bg-blue-900/20' :
                                        newPairAddress ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'
                                    }`}>
                                    {newPairAddress ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : currentStep === 'creating' ? (
                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                    )}
                                    <span className="text-sm">Create pair</span>
                                </div>
                            )}

                            <div className={`flex items-center gap-2 p-2 rounded ${currentStep === 'transferA' ? 'bg-blue-100 dark:bg-blue-900/20' :
                                    (transactionHashes.length > (!pairExists ? 1 : 0)) ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'
                                }`}>
                                {(transactionHashes.length > (!pairExists ? 1 : 0)) ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                ) : currentStep === 'transferA' ? (
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                )}
                                <span className="text-sm">Transfer {tokenA?.symbol}</span>
                            </div>

                            <div className={`flex items-center gap-2 p-2 rounded ${currentStep === 'transferB' ? 'bg-blue-100 dark:bg-blue-900/20' :
                                    (transactionHashes.length > (!pairExists ? 2 : 1)) ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'
                                }`}>
                                {(transactionHashes.length > (!pairExists ? 2 : 1)) ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                ) : currentStep === 'transferB' ? (
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                )}
                                <span className="text-sm">Transfer {tokenB?.symbol}</span>
                            </div>

                            <div className={`flex items-center gap-2 p-2 rounded ${currentStep === 'minting' ? 'bg-blue-100 dark:bg-blue-900/20' :
                                    currentStep === 'success' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'
                                }`}>
                                {currentStep === 'success' ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                ) : currentStep === 'minting' ? (
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                )}
                                <span className="text-sm">Mint LP tokens</span>
                            </div>
                        </div>

                        {/* Status Messages */}
                        <div className="space-y-2">
                            {isConfirming && (
                                <div className="flex flex-row gap-2 items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 animate-pulse">
                                    <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                                        Waiting for confirmation...
                                    </span>
                                </div>
                            )}

                            {currentStep === 'success' && (
                                <div className="flex flex-row gap-2 items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    <span className="text-green-600 dark:text-green-400 font-medium">
                                        All transactions confirmed! Redirecting...
                                    </span>
                                </div>
                            )}

                            {currentStep === 'error' && (
                                <div className="flex flex-row gap-2 items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                    <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    <span className="text-red-600 dark:text-red-400 font-medium">
                                        Error: {errorMessage}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Close/Reset buttons */}
                        <div className="flex gap-2">
                            {currentStep === 'error' && (
                                <Button
                                    onClick={resetProcess}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Try Again
                                </Button>
                            )}
                            <Button
                                onClick={() => setShowDialog(false)}
                                variant={currentStep === 'error' ? "outline" : "default"}
                                className="flex-1"
                                disabled={currentStep !== 'idle' && currentStep !== 'error' && currentStep !== 'success'}
                            >
                                {currentStep === 'success' ? 'Close' : currentStep === 'error' ? 'Close' : 'Processing...'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

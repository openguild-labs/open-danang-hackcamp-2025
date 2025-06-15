"use client"

import { useState, useEffect } from "react"
import { ArrowDownUp, ChevronDown, ExternalLink, Ban, LoaderCircle, CircleCheck, X, Hash, Wallet } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TokenInput } from "./token-input"
import { SwapSettings } from "./swap-settings"
import { contractAddresses } from "@/lib/contractAddresses"
import { useAccount, useBalance, useConfig, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi"
import { useAtomValue } from "jotai"
import { addressAtom } from "../sigpasskit"
import { localConfig } from "@/app/providers"
import { uniswapV2FactoryAbi, uniswapV2PairAbi } from "@/lib/abi"
import { Address, BaseError, getAddress, isAddress, parseUnits, formatUnits } from "viem"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { getBlockExplorerUrl, truncateHash } from "@/lib/utils";
import CopyButton from "../copy-button";
import { z } from "zod";
import { getSigpassWallet } from "@/lib/sigpass";
import { mockERC20Abi } from "@/lib/mockERC20Abi";

export interface Token {
    symbol: string
    name: string
    address: string
}

const defaultTokens: Token[] = [
    {
        symbol: "WETH",
        name: "Wrapped Ether",
        address: contractAddresses.WETH,
    },
    {
        symbol: "HARRY",
        name: "Harry Token",
        address: contractAddresses.HARRY_TOKEN,
    },
]

export function SwapComponent() {
    const config = useConfig()
    const address = useAtomValue(addressAtom)
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const { address: wagmiAddress, chainId } = useAccount()
    const [fromToken, setFromToken] = useState<Token>(defaultTokens[0])
    const [toToken, setToToken] = useState<Token>(defaultTokens[1])
    const [fromAmount, setFromAmount] = useState<string>("")
    const [toAmount, setToAmount] = useState<string>("")
    const [isSwapping, setIsSwapping] = useState(false)
    const [isApproving, setIsApproving] = useState(false)
    const [open, setOpen] = useState(false);

    const currentAddress = address || wagmiAddress

    // Get pair address from factory
    const { data: factoryData, isLoading: isFactoryDataLoading, refetch: factoryDataRefetch, isFetching: isFactoryDataFetching, } = useReadContracts({
        config,
        contracts: [
            {
                address: getAddress(contractAddresses.UNISWAP_V2_FACTORY) as Address,
                abi: uniswapV2FactoryAbi,
                functionName: "getPair",
                args: [getAddress(fromToken.address) as Address, getAddress(toToken.address) as Address],
            },
        ],
        query: {
            enabled: !!fromToken.address && !!toToken.address,
        }
    })

    const pairAddress = factoryData?.[0]?.result as string

    // Get token data and allowance
    const { data: fromTokenData } = useReadContracts({
        config,
        contracts: [
            {
                abi: mockERC20Abi,
                address: fromToken.address as Address,
                functionName: 'symbol',
                args: [],
            },
            {
                abi: mockERC20Abi,
                address: fromToken.address as Address,
                functionName: 'name',
                args: [],
            },
            {
                abi: mockERC20Abi,
                address: fromToken.address as Address,
                functionName: 'decimals',
                args: [],
            },
            {
                abi: mockERC20Abi,
                address: fromToken.address as Address,
                functionName: 'allowance',
                args: [currentAddress as Address, factoryData?.[0]?.result as Address],
            }
        ],
        query: {
            enabled: !!fromToken.address && !!currentAddress && !!factoryData?.[0]?.result,
        }
    })

    // Get to token data
    const { data: toTokenData } = useReadContracts({
        config,
        contracts: [
            {
                abi: mockERC20Abi,
                address: toToken.address as Address,
                functionName: 'symbol',
                args: [],
            },
            {
                abi: mockERC20Abi,
                address: toToken.address as Address,
                functionName: 'name',
                args: [],
            },
            {
                abi: mockERC20Abi,
                address: toToken.address as Address,
                functionName: 'decimals',
                args: [],
            }
        ],
        query: {
            enabled: !!toToken.address,
        }
    })

    const { data: pairReservesData, refetch: pairReservesDataRefetch } = useReadContract({
        config,
        address: factoryData?.[0]?.result as Address,
        abi: uniswapV2PairAbi,
        functionName: 'getReserves',
        args: [],
        query: {
            enabled: !!factoryData?.[0]?.result,
        }
    })

    // Get token0 and token1 from pair
    const { data: pairTokenData } = useReadContracts({
        config,
        contracts: [
            {
                address: factoryData?.[0]?.result as Address,
                abi: uniswapV2PairAbi,
                functionName: 'token0',
                args: [],
            },
            {
                address: factoryData?.[0]?.result as Address,
                abi: uniswapV2PairAbi,
                functionName: 'token1',
                args: [],
            }
        ],
        query: {
            enabled: !!factoryData?.[0]?.result,
        }
    })

    const {
        data: hash,
        error: writeContractError,
        isPending,
        writeContractAsync
    } = useWriteContract({
        config,
    })

    const formSchema: any = z.object({
        beneficiary: z.custom<`0x${string}`>(
            (val) => {
                if (val == null || val == undefined) return true; // Skip validation if values are missing
                console.log(val);
                return isAddress(val as `0x${string}`)
            }
            ,
            {
                message: 'Invalid address',
            })
    })

    async function onSubmit(data: z.infer<typeof formSchema>) { }

    useEffect(() => {
        if (hash) {
            setOpen(true);
        }
    }, [hash]);

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
            config,
        });

    useEffect(() => {
        if (isConfirmed) {
        }
    }, [isConfirmed]);

    // Calculate output amount based on AMM formula
    const calculateOutputAmount = (inputAmount: string): string => {
        if (!pairReservesData || !pairTokenData || !fromTokenData || !toTokenData || !inputAmount || inputAmount === "0") {
            return "0"
        }

        try {
            const [reserve0, reserve1] = pairReservesData as [bigint, bigint, number]
            const token0 = pairTokenData[0]?.result as Address
            const token1 = pairTokenData[1]?.result as Address
            const fromTokenDecimals = fromTokenData[2]?.result as number
            const toTokenDecimals = toTokenData[2]?.result as number

            if (!reserve0 || !reserve1 || reserve0 as bigint === BigInt(0) || reserve1 as bigint === BigInt(0)) {
                return "0"
            }

            // Determine which reserve corresponds to which token
            const isFromTokenToken0 = getAddress(fromToken.address).toLowerCase() === getAddress(token0).toLowerCase()
            const reserveIn = isFromTokenToken0 ? reserve0 : reserve1
            const reserveOut = isFromTokenToken0 ? reserve1 : reserve0

            // Convert input amount to wei with proper decimal handling
            let amountIn: bigint
            try {
                amountIn = parseUnits(inputAmount, fromTokenDecimals)
            } catch (error) {
                console.error("Error parsing input amount:", error)
                return "0"
            }

            // Apply 0.3% fee (997/1000)
            const amountInWithFee = (amountIn * BigInt(997)) / BigInt(1000)

            // Calculate output using AMM formula: (amountIn * reserveOut) / (reserveIn + amountIn)
            const amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee)

            // Convert back to human readable format
            return formatUnits(amountOut, toTokenDecimals)
        } catch (error) {
            console.error("Error calculating output amount:", error)
            return "0"
        }
    }

    // Update toAmount when fromAmount changes
    useEffect(() => {
        if (fromAmount && pairReservesData && pairTokenData) {
            const outputAmount = calculateOutputAmount(fromAmount)
            setToAmount(outputAmount)
        } else {
            setToAmount("")
        }
    }, [fromAmount, pairReservesData, pairTokenData, fromToken, toToken])

    // Check if approval is needed
    const needsApproval = () => {
        if (!fromTokenData || !fromAmount || fromAmount === "0") return false

        try {
            const allowance = fromTokenData[3]?.result as bigint
            const decimals = fromTokenData[2]?.result as number

            if (allowance === undefined || decimals === undefined) return false

            const requiredAmount = parseUnits(fromAmount, decimals)
            return allowance < requiredAmount
        } catch (error) {
            console.error("Error checking approval:", error)
            return false
        }
    }

    const handleApprove = async () => {
        if (!currentAddress || !fromTokenData || !factoryData?.[0]?.result) return

        setIsApproving(true)
        try {
            const decimals = fromTokenData[2]?.result as number
            const amountToApprove = parseUnits(fromAmount, decimals)

            await writeContractAsync({
                account: await getSigpassWallet(),
                address: getAddress(fromToken.address),
                abi: mockERC20Abi,
                functionName: 'approve',
                args: [getAddress(pairAddress), amountToApprove],
            })
        } catch (error) {
            console.error("Approval failed:", error)
        } finally {
            setIsApproving(false)
        }
    }

    const handleSwap = async () => {
        if (!currentAddress || !fromAmount || !toAmount || !factoryData?.[0]?.result || !pairTokenData || !fromTokenData || !toTokenData) {
            return
        }

        setIsSwapping(true)
        try {
            const pairAddress = factoryData[0].result as Address
            const token0 = pairTokenData[0]?.result as Address
            const fromTokenDecimals = fromTokenData[2]?.result as number
            const toTokenDecimals = toTokenData[2]?.result as number

            // Determine swap direction
            const isFromTokenToken0 = getAddress(fromToken.address).toLowerCase() === getAddress(token0).toLowerCase()

            // Calculate amounts with proper BigInt handling
            const fromAmountWei = parseUnits(fromAmount, fromTokenDecimals)
            const toAmountWei = parseUnits(toAmount, toTokenDecimals)

            const amount0Out = isFromTokenToken0 ? BigInt(0) : toAmountWei
            const amount1Out = isFromTokenToken0 ? toAmountWei : BigInt(0)

            // First transfer tokens to pair
            await writeContractAsync({
                address: fromToken.address as Address,
                abi: mockERC20Abi,
                functionName: 'transfer',
                args: [pairAddress, fromAmountWei],
            })

            // Then call swap
            await writeContractAsync({
                address: pairAddress,
                abi: uniswapV2PairAbi,
                functionName: 'swap',
                args: [amount0Out, amount1Out, currentAddress as Address, "0x"],
            })

            // Reset amounts after successful swap
            setFromAmount("")
            setToAmount("")
        } catch (error) {
            console.error("Swap failed:", error)
        } finally {
            setIsSwapping(false)
        }
    }

    // Update token symbols and names when contract data is available
    useEffect(() => {
        if (fromTokenData && fromTokenData[0]?.status === 'success' && fromTokenData[1]?.status === 'success') {
            setFromToken(prev => ({
                ...prev,
                symbol: fromTokenData[0].result as string,
                name: fromTokenData[1].result as string,
            }))
        }
    }, [fromTokenData])

    useEffect(() => {
        if (toTokenData && toTokenData[0]?.status === 'success' && toTokenData[1]?.status === 'success') {
            setToToken(prev => ({
                ...prev,
                symbol: toTokenData[0].result as string,
                name: toTokenData[1].result as string,
            }))
        }
    }, [toTokenData])

    const handleSwapTokens = () => {
        const tempToken = fromToken
        const tempAmount = fromAmount
        setFromToken(toToken)
        setToToken(tempToken)
        setFromAmount(toAmount)
        setToAmount(tempAmount)
    }

    const handleFromTokenSelect = (token: Token) => {
        if (token.address === toToken.address) {
            // If selected token is same as toToken, swap them
            setFromToken(token)
            setToToken(fromToken)
        } else {
            setFromToken(token)
        }
        // Clear amounts when changing tokens
        setFromAmount("")
        setToAmount("")
    }

    const handleToTokenSelect = (token: Token) => {
        if (token.address === fromToken.address) {
            // If selected token is same as fromToken, swap them
            setToToken(token)
            setFromToken(toToken)
        } else {
            setToToken(token)
        }
        // Clear amounts when changing tokens
        setFromAmount("")
        setToAmount("")
    }

    const pairExists = factoryData?.[0]?.result && factoryData[0].result !== "0x0000000000000000000000000000000000000000"
    const isSwapDisabled = !fromAmount || !toAmount || fromAmount === "0" || !pairExists || !currentAddress

    const getSwapButtonText = () => {
        if (!currentAddress) return "Connect Wallet"
        if (!fromAmount) return "Enter an amount"
        if (!pairExists) return "Pair doesn't exist"
        if (needsApproval()) return isApproving ? "Approving..." : "Approve"
        if (isSwapping) return "Swapping..."
        return "Swap"
    }

    const handleButtonClick = () => {
        if (needsApproval()) {
            handleApprove()
        } else {
            handleSwap()
        }
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <Card className="p-4 space-y-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Swap</h2>
                    <SwapSettings />
                </div>

                {/* From Token */}
                <TokenInput
                    label="From"
                    token={fromToken}
                    amount={fromAmount}
                    onTokenSelect={handleFromTokenSelect}
                    onAmountChange={setFromAmount}
                    tokens={defaultTokens}
                    showBalance
                />

                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSwapTokens}
                        className="h-8 w-8 p-0 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <ArrowDownUp className="h-4 w-4" />
                    </Button>
                </div>

                {/* To Token */}
                <TokenInput
                    label="To"
                    token={toToken}
                    amount={toAmount}
                    onTokenSelect={handleToTokenSelect}
                    onAmountChange={setToAmount}
                    tokens={defaultTokens}
                    readOnly
                />

                {/* Price Info */}
                {fromAmount && toAmount && pairExists ? (
                    <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        1 {fromToken.symbol} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken.symbol}
                    </div>
                ) : <></>}

                {/* Pair Status */}
                {fromToken.address !== toToken.address && (
                    <div className="text-xs text-center">
                        {(isFactoryDataLoading ||
                            isFactoryDataFetching) ? <span className="text-blue-600">⌛ Checking pair</span> : pairExists ? (
                                <span className="text-green-600">✓ Trading pair exists</span>
                            ) : (
                            <span className="text-red-600">⚠ Trading pair not found</span>
                        )}
                    </div>
                )}

                {/* Swap Button */}
                <Button
                    onClick={handleButtonClick}
                    disabled={isSwapDisabled || isSwapping || isApproving}
                    className="w-full h-12 text-lg font-medium"
                >
                    {getSwapButtonText()}
                </Button>
            </Card>

            {
                isDesktop ? (
                    <Dialog open={open} onOpenChange={setOpen} >
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full md:w-2/3 mx-auto flex items-center gap-2 h-14 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all bg-white/80 dark:bg-black/50 backdrop-blur-sm shadow-md hover:shadow-indigo-300 dark:hover:shadow-indigo-900/40 group"
                            >
                                <Hash className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform" />
                                Transaction Status
                                <ChevronDown className="ml-auto transition-transform group-hover:scale-110" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-b from-white to-indigo-50/50 dark:from-slate-900 dark:to-indigo-950/50 backdrop-blur-md shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                                    Transaction Status
                                </DialogTitle>
                            </DialogHeader>
                            <DialogDescription className="text-center">
                                Track your transaction progress below
                            </DialogDescription>
                            <div className="flex flex-col gap-4 p-4 bg-indigo-50/80 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                                {hash ? (
                                    <div className="flex flex-row gap-2 items-center p-3 bg-white/90 dark:bg-black/40 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:shadow-md transition-all duration-200">
                                        <Hash className="w-5 h-5 text-indigo-600" />
                                        <span className="font-medium">Transaction Hash:</span>
                                        <a
                                            className="flex flex-row gap-2 items-center underline underline-offset-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                            href={`${getBlockExplorerUrl(config, chainId)}/tx/${hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {truncateHash(hash)}
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                        <CopyButton copyText={hash} />
                                    </div>
                                ) : (
                                    <div className="flex flex-row gap-2 items-center p-3 bg-white/90 dark:bg-black/40 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                        <Hash className="w-5 h-5 text-gray-500" />
                                        <span className="text-gray-500">No transaction hash available</span>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    {!isPending && !isConfirmed && !isConfirming && (
                                        <div className="flex flex-row gap-2 items-center p-3 bg-white/90 dark:bg-black/40 rounded-lg border border-gray-200 dark:border-gray-800">
                                            <Ban className="w-5 h-5 text-gray-500" />
                                            <span className="text-gray-500">No transaction submitted yet</span>
                                        </div>
                                    )}

                                    {isConfirming && (
                                        <div className="flex flex-row gap-2 items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 animate-pulse">
                                            <LoaderCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-spin" />
                                            <span className="text-yellow-600 dark:text-yellow-400 font-medium">Waiting for confirmation...</span>
                                        </div>
                                    )}

                                    {isConfirmed && (
                                        <div className="flex flex-row gap-2 items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                            <CircleCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            <span className="text-green-600 dark:text-green-400 font-medium">Transaction confirmed successfully!</span>
                                        </div>
                                    )}

                                    {writeContractError && (
                                        <div className="flex flex-row gap-2 items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                            <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            <span className="text-red-600 dark:text-red-400 font-medium">
                                                Error: {(writeContractError as BaseError).shortMessage || writeContractError.message}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline" className="w-full rounded-lg border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all bg-gradient-to-r hover:bg-gradient-to-r from-transparent to-transparent hover:from-indigo-50 hover:to-blue-50 dark:hover:from-indigo-950/50 dark:hover:to-blue-950/50">
                                        Close
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                ) : (
                    <Drawer open={open} onOpenChange={setOpen}>
                        <DrawerTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full flex items-center gap-2 h-14 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all bg-white/80 dark:bg-black/50 backdrop-blur-sm shadow-md hover:shadow-indigo-300 dark:hover:shadow-indigo-900/40 group"
                            >
                                <Hash className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform" />
                                Transaction Status
                                <ChevronDown className="ml-auto transition-transform group-hover:scale-110" />
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className="px-4 rounded-t-xl border-t-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-b from-white to-indigo-50/50 dark:from-slate-900 dark:to-indigo-950/50">
                            <DrawerHeader className="pb-2">
                                <DrawerTitle className="text-xl font-bold text-center bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                                    Transaction Status
                                </DrawerTitle>
                                <DrawerDescription className="text-center">
                                    Track your transaction progress below
                                </DrawerDescription>
                            </DrawerHeader>
                            <div className="flex flex-col gap-4 p-4 bg-indigo-50/80 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900/50 mb-4">
                                {hash ? (
                                    <div className="flex flex-row gap-2 items-center p-3 bg-white/90 dark:bg-black/40 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                        <Hash className="w-5 h-5 flex-shrink-0 text-indigo-600" />
                                        <div className="flex flex-col">
                                            <span className="font-medium">Transaction Hash:</span>
                                            <a
                                                className="flex flex-row gap-2 items-center underline underline-offset-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm"
                                                href={`${getBlockExplorerUrl(config, chainId)}/tx/${hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {truncateHash(hash)}
                                                <ExternalLink className="w-4 h-4" />
                                                <CopyButton copyText={hash} />
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-row gap-2 items-center p-3 bg-white/90 dark:bg-black/40 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                        <Hash className="w-5 h-5 text-gray-500" />
                                        <span className="text-gray-500">No transaction hash available</span>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    {!isPending && !isConfirmed && !isConfirming && (
                                        <div className="flex flex-row gap-2 items-center p-3 bg-white/90 dark:bg-black/40 rounded-lg border border-gray-200 dark:border-gray-800">
                                            <Ban className="w-5 h-5 text-gray-500" />
                                            <span className="text-gray-500">No transaction submitted yet</span>
                                        </div>
                                    )}

                                    {isConfirming && (
                                        <div className="flex flex-row gap-2 items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 animate-pulse">
                                            <LoaderCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-spin" />
                                            <span className="text-yellow-600 dark:text-yellow-400 font-medium">Waiting for confirmation...</span>
                                        </div>
                                    )}

                                    {isConfirmed && (
                                        <div className="flex flex-row gap-2 items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                            <CircleCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            <span className="text-green-600 dark:text-green-400 font-medium">Transaction confirmed successfully!</span>
                                        </div>
                                    )}

                                    {writeContractError && (
                                        <div className="flex flex-row gap-2 items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                            <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            <span className="text-red-600 dark:text-red-400 font-medium">
                                                Error: {(writeContractError as BaseError).shortMessage || writeContractError.message}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <DrawerFooter>
                                <DrawerClose asChild>
                                    <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20">
                                        Close
                                    </Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </DrawerContent >
                    </Drawer >
                )
            }
        </div>
    )
}

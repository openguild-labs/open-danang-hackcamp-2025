"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DollarSign, TrendingDown, AlertTriangle, CheckCircle, Hash, ExternalLink, Ban, ChevronDown, LoaderCircle, X } from "lucide-react";
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useConfig, type BaseError } from 'wagmi';
import { parseUnits, formatUnits, Address } from 'viem';
import { lendingBorrowingAbi } from '@/lib/lendingBorrowingAbi';
import { erc20Abi } from '@/lib/abi';
import { contractAddresses } from '@/lib/contractAddresses';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { truncateHash } from "@/lib/utils";
import CopyButton from "@/components/copy-button";

// Contract addresses
const LENDING_CONTRACT = "0x1234567890123456789012345678901234567890";
const LENDING_TOKEN = "0x1234567890123456789012345678901234567890";

const formSchema = z.object({
    amount: z
        .string()
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: "Amount must be a positive number",
        }),
});

export default function BorrowingComponent() {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("borrow");

    const { address } = useAccount();
    const { toast } = useToast();
    const config = useConfig();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const { writeContractAsync, data: hash, isPending, error } = useWriteContract({
        mutation: {
            onSuccess: () => {
                toast({
                    title: "Transaction Submitted",
                    description: "Your transaction has been submitted to the network.",
                });
            },
            onError: (error) => {
                toast({
                    title: "Transaction Failed",
                    description: error.message,
                    variant: "destructive",
                });
            },
        },
    });

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    // Read contract data
    const { data: contractData, refetch } = useReadContracts({
        contracts: [
            {
                address: contractAddresses.LendingBorrowing as Address,
                abi: lendingBorrowingAbi,
                functionName: "collateralBalances",
                args: [address as Address],
            },
            {
                address: contractAddresses.LendingBorrowing as Address,
                abi: lendingBorrowingAbi,
                functionName: "getLoanDetails",
                args: [address as Address],
            },
            {
                address: contractAddresses.LendingBorrowing as Address,
                abi: lendingBorrowingAbi,
                functionName: "collateralFactor",
            },
            {
                address: contractAddresses.HARRY_LendingToken as Address,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [address as Address],
            },
            {
                address: contractAddresses.HARRY_LendingToken as Address,
                abi: erc20Abi,
                functionName: "allowance",
                args: [address as Address, contractAddresses.LendingBorrowing as Address],
            },
            {
                address: contractAddresses.HARRY_LendingToken as Address,
                abi: erc20Abi,
                functionName: "decimals",
            },
            {
                address: contractAddresses.HARRY_LendingToken as Address,
                abi: erc20Abi,
                functionName: "symbol",
            },
        ],
    });

    const depositedCollateral = contractData?.[0]?.result as bigint | undefined;
    const loanDetails = contractData?.[1]?.result as [bigint, bigint, boolean] | undefined;
    const collateralFactor = contractData?.[2]?.result as bigint | undefined;
    const balance = contractData?.[3]?.result as bigint | undefined;
    const allowance = contractData?.[4]?.result as bigint | undefined;
    const decimals = contractData?.[5]?.result as number | undefined;
    const symbol = contractData?.[6]?.result as string | undefined;

    const hasActiveLoan = loanDetails?.[2] || false;
    const loanAmount = loanDetails?.[0] || BigInt(0);
    const lockedCollateral = loanDetails?.[1] || BigInt(0);

    const maxLoanAmount = depositedCollateral && collateralFactor
        ? (depositedCollateral * collateralFactor) / BigInt(100)
        : BigInt(0);

    const borrowForm = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { amount: "" },
    });

    const repayForm = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { amount: "" },
    });

    const repayAmount = repayForm.watch("amount");

    const needsRepayApproval = allowance !== undefined && repayAmount
        ? allowance < parseUnits(repayAmount, decimals || 18)
        : true;

    // Watch for transaction hash and open dialog/drawer when received
    useEffect(() => {
        if (hash) {
            setOpen(true);
        }
    }, [hash]);

    // Refetch data when transaction is confirmed
    useEffect(() => {
        if (isConfirmed) {
            refetch();
        }
    }, [isConfirmed, refetch]);

    const chainId = useAccount().chainId;

    function getBlockExplorerUrl(chainId: number | undefined): string | undefined {
        const chain = config.chains?.find(chain => chain.id === chainId);
        return chain?.blockExplorers?.default?.url || config.chains?.[0]?.blockExplorers?.default?.url;
    }

    async function onBorrowSubmit(values: z.infer<typeof formSchema>) {
        const amountBigInt = parseUnits(values.amount, decimals || 18);

        await writeContractAsync({
            address: contractAddresses.LendingBorrowing as Address,
            abi: lendingBorrowingAbi,
            functionName: "takeLoan",
            args: [amountBigInt],
        });
    }

    async function onRepaySubmit(values: z.infer<typeof formSchema>) {
        const amountBigInt = parseUnits(values.amount, decimals || 18);

        if (needsRepayApproval) {
            await writeContractAsync({
                address: contractAddresses.HARRY_LendingToken as Address,
                abi: erc20Abi,
                functionName: "approve",
                args: [contractAddresses.LendingBorrowing as Address, amountBigInt],
            });
        } else {
            await writeContractAsync({
                address: contractAddresses.LendingBorrowing as Address,
                abi: lendingBorrowingAbi,
                functionName: "repayLoan",
                args: [amountBigInt],
            });
        }
    }

    const healthFactor = hasActiveLoan && loanAmount > 0
        ? (lockedCollateral * BigInt(100)) / (loanAmount * (collateralFactor || BigInt(150)))
        : BigInt(0);

    const getHealthFactorColor = (factor: bigint) => {
        if (factor >= BigInt(150)) return "text-green-600";
        if (factor >= BigInt(120)) return "text-yellow-600";
        return "text-red-600";
    };

    const TransactionStatusDialog = () => (
        isDesktop ? (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full mt-4">
                        Transaction status <ChevronDown />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Transaction status</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        Follow the transaction status below.
                    </DialogDescription>
                    <div className="flex flex-col gap-2">
                        {hash ? (
                            <div className="flex flex-row gap-2 items-center">
                                <Hash className="w-4 h-4" />
                                Transaction Hash
                                <a
                                    className="flex flex-row gap-2 items-center underline underline-offset-4"
                                    href={`${getBlockExplorerUrl(chainId)}/tx/${hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {truncateHash(hash)}
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                <CopyButton copyText={hash} />
                            </div>
                        ) : (
                            <div className="flex flex-row gap-2 items-center">
                                <Hash className="w-4 h-4" />
                                No transaction hash
                            </div>
                        )}
                        {!isPending && !isConfirmed && !isConfirming && (
                            <div className="flex flex-row gap-2 items-center">
                                <Ban className="w-4 h-4" /> No transaction submitted
                            </div>
                        )}
                        {isConfirming && (
                            <div className="flex flex-row gap-2 items-center text-yellow-500">
                                <LoaderCircle className="w-4 h-4 animate-spin" />{" "}
                                Waiting for confirmation...
                            </div>
                        )}
                        {isConfirmed && (
                            <div className="flex flex-row gap-2 items-center text-green-500">
                                <CheckCircle className="w-4 h-4" /> Transaction
                                confirmed!
                            </div>
                        )}
                        {error && (
                            <div className="flex flex-row gap-2 items-center text-red-500">
                                <X className="w-4 h-4" /> Error:{" "}
                                {(error as BaseError).shortMessage || error.message}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        ) : (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                    <Button variant="outline" className="w-full mt-4">
                        Transaction status <ChevronDown />
                    </Button>
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Transaction status</DrawerTitle>
                        <DrawerDescription>
                            Follow the transaction status below.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="flex flex-col gap-2 p-4">
                        {hash ? (
                            <div className="flex flex-row gap-2 items-center">
                                <Hash className="w-4 h-4" />
                                Transaction Hash
                                <a
                                    className="flex flex-row gap-2 items-center underline underline-offset-4"
                                    href={`${getBlockExplorerUrl(chainId)}/tx/${hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {truncateHash(hash)}
                                    <ExternalLink className="w-4 h-4" />
                                    <CopyButton copyText={hash} />
                                </a>
                            </div>
                        ) : (
                            <div className="flex flex-row gap-2 items-center">
                                <Hash className="w-4 h-4" />
                                No transaction hash
                            </div>
                        )}
                        {!isPending && !isConfirmed && !isConfirming && (
                            <div className="flex flex-row gap-2 items-center">
                                <Ban className="w-4 h-4" /> No transaction submitted
                            </div>
                        )}
                        {isConfirming && (
                            <div className="flex flex-row gap-2 items-center text-yellow-500">
                                <LoaderCircle className="w-4 h-4 animate-spin" />{" "}
                                Waiting for confirmation...
                            </div>
                        )}
                        {isConfirmed && (
                            <div className="flex flex-row gap-2 items-center text-green-500">
                                <CheckCircle className="w-4 h-4" /> Transaction
                                confirmed!
                            </div>
                        )}
                        {error && (
                            <div className="flex flex-row gap-2 items-center text-red-500">
                                <X className="w-4 h-4" /> Error:{" "}
                                {(error as BaseError).shortMessage || error.message}
                            </div>
                        )}
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="outline">Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        )
    );

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="borrow">Borrow</TabsTrigger>
                    <TabsTrigger value="repay">Repay</TabsTrigger>
                </TabsList>

                <TabsContent value="borrow" className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-muted-foreground">
                            Max Borrow: {formatUnits(maxLoanAmount, decimals || 18)} {symbol}
                        </span>
                    </div>

                    {hasActiveLoan ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <AlertTriangle className="h-12 w-12 text-yellow-500" />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold">Active Loan Found</h3>
                                <p className="text-muted-foreground">
                                    You already have an active loan. Please repay it before taking a new one.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <Form {...borrowForm}>
                            <form onSubmit={borrowForm.handleSubmit(onBorrowSubmit)} className="space-y-6">
                                <FormField
                                    control={borrowForm.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Loan Amount</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        placeholder="0.00"
                                                        {...field}
                                                        className="pr-16"
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                        {symbol}
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Borrow tokens against your collateral
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" disabled={isPending} className="w-full">
                                    {isPending ? (
                                        <>
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                            Taking Loan...
                                        </>
                                    ) : (
                                        "Borrow"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    )}
                </TabsContent>

                <TabsContent value="repay" className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                        <span className="text-sm text-muted-foreground">
                            Available: {balance ? formatUnits(balance, decimals || 18) : "0"} {symbol}
                        </span>
                    </div>

                    {!hasActiveLoan ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <DollarSign className="h-12 w-12 text-gray-400" />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold">No Active Loan</h3>
                                <p className="text-muted-foreground">
                                    You don't have any active loans to repay.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <Form {...repayForm}>
                            <form onSubmit={repayForm.handleSubmit(onRepaySubmit)} className="space-y-6">
                                <FormField
                                    control={repayForm.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount to Repay</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        placeholder="0.00"
                                                        {...field}
                                                        className="pr-16"
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                        {symbol}
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Repay your outstanding loan amount
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    {needsRepayApproval && (
                                        <Button type="submit" disabled={isPending}>
                                            {isPending ? (
                                                <>
                                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                    Approving...
                                                </>
                                            ) : (
                                                "Approve"
                                            )}
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        disabled={isPending || needsRepayApproval}
                                        className={needsRepayApproval ? "col-span-1" : "col-span-2"}
                                    >
                                        {isPending ? (
                                            <>
                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                Repaying...
                                            </>
                                        ) : (
                                            "Repay Loan"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </TabsContent>
            </Tabs>

            <TransactionStatusDialog />

            {/* Loan Summary */}
            {hasActiveLoan && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Active Loan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Outstanding Loan</p>
                                <p className="text-lg font-semibold text-red-600">
                                    {formatUnits(loanAmount, decimals || 18)} {symbol}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Health Factor</p>
                                <div className="flex items-center gap-2">
                                    <p className={`text-lg font-semibold ${getHealthFactorColor(healthFactor)}`}>
                                        {Number(healthFactor) / 100}x
                                    </p>
                                    <Badge
                                        variant={healthFactor >= BigInt(150) ? "default" : "destructive"}
                                        className="text-xs"
                                    >
                                        {healthFactor >= BigInt(150) ? "Safe" : healthFactor >= BigInt(120) ? "Moderate" : "At Risk"}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {healthFactor < BigInt(120) && (
                            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    Your position is at risk. Consider adding more collateral or repaying part of your loan.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

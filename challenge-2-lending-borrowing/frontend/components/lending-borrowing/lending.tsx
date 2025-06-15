"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Wallet, TrendingUp, Shield, AlertCircle, CheckCircle, Hash, ExternalLink, Ban, ChevronDown, LoaderCircle, X } from "lucide-react";
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

const formSchema = z.object({
    amount: z
        .string()
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: "Amount must be a positive number",
        }),
});

export default function LendingComponent() {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("supply");

    const { address } = useAccount();
    const { toast } = useToast();
    const config = useConfig();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const { writeContract, data: hash, isPending, error } = useWriteContract({
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
                address: contractAddresses.HARRY_CollateralToken as Address,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [address as Address],
            },
            {
                address: contractAddresses.HARRY_CollateralToken as Address,
                abi: erc20Abi,
                functionName: "allowance",
                args: [address as Address, contractAddresses.LendingBorrowing as Address],
            },
            {
                address: contractAddresses.HARRY_CollateralToken as Address,
                abi: erc20Abi,
                functionName: "decimals",
            },
            {
                address: contractAddresses.HARRY_CollateralToken as Address,
                abi: erc20Abi,
                functionName: "symbol",
            },
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
        ],
    });

    const balance = contractData?.[0]?.result as bigint | undefined;
    const allowance = contractData?.[1]?.result as bigint | undefined;
    const decimals = contractData?.[2]?.result as number | undefined;
    const symbol = contractData?.[3]?.result as string | undefined;
    const depositedCollateral = contractData?.[4]?.result as bigint | undefined;
    const loanDetails = contractData?.[5]?.result as [bigint, bigint, boolean] | undefined;

    const hasActiveLoan = loanDetails?.[2] || false;

    const supplyForm = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { amount: "" },
    });

    const withdrawForm = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { amount: "" },
    });

    const supplyAmount = supplyForm.watch("amount");
    const withdrawAmount = withdrawForm.watch("amount");

    const needsSupplyApproval = allowance !== undefined && supplyAmount
        ? allowance < parseUnits(supplyAmount, decimals || 18)
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

    async function onSupplySubmit(values: z.infer<typeof formSchema>) {
        const amountBigInt = parseUnits(values.amount, decimals || 18);

        if (needsSupplyApproval) {
            writeContract({
                address: contractAddresses.HARRY_CollateralToken as Address,
                abi: erc20Abi,
                functionName: "approve",
                args: [contractAddresses.LendingBorrowing as Address, amountBigInt],
            });
        } else {
            writeContract({
                address: contractAddresses.LendingBorrowing as Address,
                abi: lendingBorrowingAbi,
                functionName: "depositCollateral",
                args: [amountBigInt],
            });
        }
    }

    async function onWithdrawSubmit(values: z.infer<typeof formSchema>) {
        const amountBigInt = parseUnits(values.amount, decimals || 18);

        writeContract({
            address: contractAddresses.LendingBorrowing as Address,
            abi: lendingBorrowingAbi,
            functionName: "withdrawCollateral",
            args: [amountBigInt],
        });
    }

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="supply">Supply</TabsTrigger>
                    <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                </TabsList>

                <TabsContent value="supply" className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-muted-foreground">
                            Available: {balance ? formatUnits(balance, decimals || 18) : "0"} {symbol}
                        </span>
                    </div>

                    <Form {...supplyForm}>
                        <form onSubmit={supplyForm.handleSubmit(onSupplySubmit)} className="space-y-6">
                            <FormField
                                control={supplyForm.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount to Supply</FormLabel>
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
                                            Supply tokens to earn yield and use as collateral
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                {needsSupplyApproval && (
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
                                    disabled={isPending || needsSupplyApproval}
                                    className={needsSupplyApproval ? "col-span-1" : "col-span-2"}
                                >
                                    {isPending ? (
                                        <>
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                            Supplying...
                                        </>
                                    ) : (
                                        "Supply"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </TabsContent>

                <TabsContent value="withdraw" className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-muted-foreground">
                            Supplied: {depositedCollateral ? formatUnits(depositedCollateral, decimals || 18) : "0"} {symbol}
                        </span>
                    </div>

                    {hasActiveLoan ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <AlertCircle className="h-12 w-12 text-yellow-500" />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold">Active Loan Found</h3>
                                <p className="text-muted-foreground">
                                    You cannot withdraw collateral while you have an active loan.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <Form {...withdrawForm}>
                            <form onSubmit={withdrawForm.handleSubmit(onWithdrawSubmit)} className="space-y-6">
                                <FormField
                                    control={withdrawForm.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount to Withdraw</FormLabel>
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
                                                Withdraw your supplied tokens
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" disabled={isPending} className="w-full">
                                    {isPending ? (
                                        <>
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                            Withdrawing...
                                        </>
                                    ) : (
                                        "Withdraw"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    )}
                </TabsContent>
            </Tabs>

            {/* Transaction Status Dialog */}
            {isDesktop ? (
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
            )}

            {/* Summary Card */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Your Supply</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-semibold">
                        {depositedCollateral ? formatUnits(depositedCollateral, decimals || 18) : "0.00"} {symbol}
                    </div>
                    <p className="text-xs text-muted-foreground">Total supplied amount</p>
                </CardContent>
            </Card>
        </div>
    );
}

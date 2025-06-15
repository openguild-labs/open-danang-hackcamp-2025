"use client";

import { useState } from "react";
import { useWriteContract, useReadContracts, useAccount } from "wagmi";
import { parseUnits, formatUnits, Address } from "viem";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TrendingDown, LoaderCircle, AlertCircle } from "lucide-react";

import { lendingBorrowingAbi } from "@/lib/lendingBorrowingAbi";
import { erc20Abi } from "@/lib/abi";
import { contractAddresses } from "@/lib/contractAddresses";

const formSchema = z.object({
  amount: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
});

export default function RepayLoan() {
  const { address } = useAccount();

  const { writeContract, isPending } = useWriteContract();

  const { data: contractData } = useReadContracts({
    contracts: [
      {
        address: contractAddresses.LendingBorrowing as Address,
        abi: lendingBorrowingAbi,
        functionName: "getLoanDetails",
        args: [address as Address],
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

  const loanDetails = contractData?.[0]?.result as [bigint, bigint, boolean] | undefined;
  const balance = contractData?.[1]?.result as bigint | undefined;
  const allowance = contractData?.[2]?.result as bigint | undefined;
  const decimals = contractData?.[3]?.result as number | undefined;
  const symbol = contractData?.[4]?.result as string | undefined;

  const hasActiveLoan = loanDetails?.[2] || false;
  const loanAmount = loanDetails?.[0] || BigInt(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
    },
  });

  const amount = form.watch("amount");
  const needsApproval = allowance !== undefined && amount
    ? allowance < parseUnits(amount, decimals || 18)
    : true;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const amountBigInt = parseUnits(values.amount, decimals || 18);

    if (needsApproval) {
      // Approve first
      writeContract({
        address: contractAddresses.HARRY_LendingToken as Address,
        abi: erc20Abi,
        functionName: "approve",
        args: [contractAddresses.LendingBorrowing as Address, amountBigInt],
      });
    } else {
      // Repay loan
      writeContract({
        address: contractAddresses.LendingBorrowing as Address,
        abi: lendingBorrowingAbi,
        functionName: "repayLoan",
        args: [amountBigInt],
      });
    }
  }

  if (!hasActiveLoan) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <AlertCircle className="h-12 w-12 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">No Active Loan</h3>
          <p className="text-muted-foreground">
            You don't have any active loans to repay.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingDown className="h-5 w-5 text-red-600" />
        <span className="text-sm text-muted-foreground">
          Available: {balance ? formatUnits(balance, decimals || 18) : "0"} {symbol}
        </span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
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
            {needsApproval && (
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
              disabled={isPending || needsApproval}
              className={needsApproval ? "col-span-1" : "col-span-2"}
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

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Outstanding Loan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-red-600">
              {formatUnits(loanAmount, decimals || 18)}
            </div>
            <p className="text-xs text-muted-foreground">Amount to repay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Collateral Locked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {loanDetails ? formatUnits(loanDetails[1], 18) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Locked amount</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

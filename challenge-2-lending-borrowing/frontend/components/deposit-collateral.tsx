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
import { Shield, LoaderCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { lendingBorrowingAbi } from "@/lib/lendingBorrowingAbi";
import { erc20Abi } from "@/lib/abi";
import { useToast } from "@/hooks/use-toast";

const LENDING_CONTRACT = "0x1234567890123456789012345678901234567890"; // Replace with actual address
const COLLATERAL_TOKEN = "0x1234567890123456789012345678901234567890"; // Replace with actual address

const formSchema = z.object({
  amount: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
});

export default function DepositCollateral() {
  const { address } = useAccount();
  const { toast } = useToast();
  
  const { writeContract, isPending } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Collateral deposited successfully!",
        });
        form.reset();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    },
  });

  const { data: contractData } = useReadContracts({
    contracts: [
      {
        address: COLLATERAL_TOKEN,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as Address],
      },
      {
        address: COLLATERAL_TOKEN,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address as Address, LENDING_CONTRACT],
      },
      {
        address: COLLATERAL_TOKEN,
        abi: erc20Abi,
        functionName: "decimals",
      },
      {
        address: COLLATERAL_TOKEN,
        abi: erc20Abi,
        functionName: "symbol",
      },
      {
        address: LENDING_CONTRACT,
        abi: lendingBorrowingAbi,
        functionName: "collateralBalances",
        args: [address as Address],
      },
    ],
  });

  const balance = contractData?.[0]?.result as bigint | undefined;
  const allowance = contractData?.[1]?.result as bigint | undefined;
  const decimals = contractData?.[2]?.result as number | undefined;
  const symbol = contractData?.[3]?.result as string | undefined;
  const depositedCollateral = contractData?.[4]?.result as bigint | undefined;

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
        address: COLLATERAL_TOKEN,
        abi: erc20Abi,
        functionName: "approve",
        args: [LENDING_CONTRACT, amountBigInt],
      });
    } else {
      // Deposit collateral
      writeContract({
        address: LENDING_CONTRACT,
        abi: lendingBorrowingAbi,
        functionName: "depositCollateral",
        args: [amountBigInt],
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-blue-600" />
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
                <FormLabel>Amount to Deposit</FormLabel>
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
                  Deposit tokens as collateral for borrowing
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
                  Depositing...
                </>
              ) : (
                "Deposit Collateral"
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Info Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Current Collateral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold">
            {depositedCollateral ? formatUnits(depositedCollateral, decimals || 18) : "0.00"}
          </div>
          <p className="text-xs text-muted-foreground">Deposited amount</p>
        </CardContent>
      </Card>
    </div>
  );
}

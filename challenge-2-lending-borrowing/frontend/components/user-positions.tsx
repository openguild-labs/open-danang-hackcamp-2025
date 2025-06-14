"use client";

import { useReadContracts, useAccount } from "wagmi";
import { formatUnits, Address } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

import { lendingBorrowingAbi } from "@/lib/lendingBorrowingAbi";
import { erc20Abi } from "@/lib/abi";

const LENDING_CONTRACT = "0x1234567890123456789012345678901234567890"; // Replace with actual address
const LENDING_TOKEN = "0x1234567890123456789012345678901234567890"; // Replace with actual address
const COLLATERAL_TOKEN = "0x1234567890123456789012345678901234567890"; // Replace with actual address

export default function UserPositions() {
  const { address } = useAccount();

  const { data: contractData, isLoading } = useReadContracts({
    contracts: [
      {
        address: LENDING_CONTRACT,
        abi: lendingBorrowingAbi,
        functionName: "collateralBalances",
        args: [address as Address],
      },
      {
        address: LENDING_CONTRACT,
        abi: lendingBorrowingAbi,
        functionName: "getLoanDetails",
        args: [address as Address],
      },
      {
        address: LENDING_CONTRACT,
        abi: lendingBorrowingAbi,
        functionName: "collateralFactor",
      },
      {
        address: LENDING_TOKEN,
        abi: erc20Abi,
        functionName: "decimals",
      },
      {
        address: LENDING_TOKEN,
        abi: erc20Abi,
        functionName: "symbol",
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
    ],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  const depositedCollateral = contractData?.[0]?.result as bigint | undefined;
  const loanDetails = contractData?.[1]?.result as [bigint, bigint, boolean] | undefined;
  const collateralFactor = contractData?.[2]?.result as bigint | undefined;
  const lendingDecimals = contractData?.[3]?.result as number | undefined;
  const lendingSymbol = contractData?.[4]?.result as string | undefined;
  const collateralDecimals = contractData?.[5]?.result as number | undefined;
  const collateralSymbol = contractData?.[6]?.result as string | undefined;

  const hasActiveLoan = loanDetails?.[2] || false;
  const loanAmount = loanDetails?.[0] || BigInt(0);
  const lockedCollateral = loanDetails?.[1] || BigInt(0);

  const healthFactor = hasActiveLoan && loanAmount > 0
    ? (lockedCollateral * BigInt(100)) / (loanAmount * (collateralFactor || BigInt(150)))
    : BigInt(0);

  const getHealthFactorColor = (factor: bigint) => {
    if (factor >= BigInt(150)) return "text-green-600";
    if (factor >= BigInt(120)) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthFactorStatus = (factor: bigint) => {
    if (factor >= BigInt(150)) return "Safe";
    if (factor >= BigInt(120)) return "Moderate";
    return "At Risk";
  };

  return (
    <div className="space-y-6">
      {/* Position Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collateral</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {depositedCollateral
                ? formatUnits(depositedCollateral, collateralDecimals || 18)
                : "0.00"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {collateralSymbol} deposited
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasActiveLoan
                ? formatUnits(loanAmount, lendingDecimals || 18)
                : "0.00"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {lendingSymbol} borrowed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loan Details */}
      {hasActiveLoan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Loan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Locked Collateral</p>
                <p className="text-lg font-semibold">
                  {formatUnits(lockedCollateral, collateralDecimals || 18)} {collateralSymbol}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Loan Amount</p>
                <p className="text-lg font-semibold">
                  {formatUnits(loanAmount, lendingDecimals || 18)} {lendingSymbol}
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
                    {getHealthFactorStatus(healthFactor)}
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

      {/* No Positions */}
      {!hasActiveLoan && (!depositedCollateral || depositedCollateral === BigInt(0)) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Positions</h3>
            <p className="text-muted-foreground mb-4">
              Start by depositing collateral to begin lending and borrowing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
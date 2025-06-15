"use client";
import { useAccount, useReadContracts } from "wagmi";
import { formatUnits, Address } from "viem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Shield, BarChart3 } from "lucide-react";
import { lendingBorrowingAbi } from "@/lib/lendingBorrowingAbi";
import { erc20Abi } from "@/lib/abi";
import { contractAddresses } from "@/lib/contractAddresses";

// Import position component
import UserPositions from "@/components/portfolio/user-positions";

export default function PortfolioPage() {
    const { address } = useAccount();

    // Read real-time data from contracts
    const { data: portfolioData } = useReadContracts({
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
                functionName: "decimals",
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
                address: contractAddresses.HARRY_LendingToken as Address,
                abi: erc20Abi,
                functionName: "symbol",
            },
        ],
    });

    const depositedCollateral = portfolioData?.[0]?.result as bigint | undefined;
    const loanDetails = portfolioData?.[1]?.result as [bigint, bigint, boolean] | undefined;
    const collateralFactor = portfolioData?.[2]?.result as bigint | undefined;
    const lendingDecimals = portfolioData?.[3]?.result as number | undefined;
    const collateralDecimals = portfolioData?.[4]?.result as number | undefined;
    const collateralSymbol = portfolioData?.[5]?.result as string | undefined;
    const lendingSymbol = portfolioData?.[6]?.result as string | undefined;

    const hasActiveLoan = loanDetails?.[2] || false;
    const loanAmount = loanDetails?.[0] || BigInt(0);
    const lockedCollateral = loanDetails?.[1] || BigInt(0);

    const healthFactor = hasActiveLoan && loanAmount > 0
        ? (lockedCollateral * BigInt(100)) / (loanAmount * (collateralFactor || BigInt(150)))
        : BigInt(0);

    const getHealthFactorStatus = () => {
        if (!hasActiveLoan) return { status: "Safe", color: "text-green-600", variant: "default" as const };
        if (healthFactor >= BigInt(150)) return { status: "Safe", color: "text-green-600", variant: "default" as const };
        if (healthFactor >= BigInt(120)) return { status: "Moderate", color: "text-yellow-600", variant: "secondary" as const };
        return { status: "At Risk", color: "text-red-600", variant: "destructive" as const };
    };

    const healthStatus = getHealthFactorStatus();

    // Calculate total portfolio value (simplified)
    const totalCollateralValue = depositedCollateral ? Number(formatUnits(depositedCollateral, collateralDecimals || 18)) : 0;
    const totalLoanValue = hasActiveLoan ? Number(formatUnits(loanAmount, lendingDecimals || 18)) : 0;
    const netWorth = totalCollateralValue - totalLoanValue;

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
                <p className="text-muted-foreground">
                    Track your lending and borrowing positions
                </p>
            </div>

            {/* Portfolio Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Collateral</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {depositedCollateral
                                ? `${formatUnits(depositedCollateral, collateralDecimals || 18)} ${collateralSymbol}`
                                : "0.00"
                            }
                        </div>
                        <p className="text-xs text-muted-foreground">Deposited collateral value</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {hasActiveLoan
                                ? `${formatUnits(loanAmount, lendingDecimals || 18)} ${lendingSymbol}`
                                : "0.00"
                            }
                        </div>
                        <p className="text-xs text-muted-foreground">Outstanding loan amount</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Health Factor</CardTitle>
                        <TrendingUp className={`h-4 w-4 ${healthStatus.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className={`text-2xl font-bold ${healthStatus.color}`}>
                                {hasActiveLoan ? `${Number(healthFactor) / 100}x` : "∞"}
                            </div>
                            <Badge variant={healthStatus.variant} className="text-xs">
                                {healthStatus.status}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Risk level indicator</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {netWorth.toFixed(4)}
                        </div>
                        <p className="text-xs text-muted-foreground">Collateral - Loans</p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Positions */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Positions</CardTitle>
                    <CardDescription>
                        Detailed view of your lending and borrowing positions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <UserPositions />
                </CardContent>
            </Card>
        </div>
    );
}

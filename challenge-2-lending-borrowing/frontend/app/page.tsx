"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getLendingContract } from "../utils/contract";
import SigpassKit from "@/components/sigpasskit";
import { useAccount } from "wagmi";
import { useAtom } from "jotai";
import { addressAtom } from "@/components/sigpasskit";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LendingApp() {
  const [provider, setProvider] = useState<any>();
  const [signer, setSigner] = useState<any>();
  const { address: wagmiAddress, isConnected } = useAccount();
  const [sigpassAddress] = useAtom(addressAtom);
  const [collateral, setCollateral] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [loan, setLoan] = useState<{
    amount: string;
    collateral: string;
    isActive: boolean;
  }>({
    amount: "0",
    collateral: "0",
    isActive: false,
  });
  const { toast } = useToast();

  const account = wagmiAddress || sigpassAddress;

  const connectWallet = async () => {
    if (!account) return;
    try {
      setIsLoading(true);
      const ethereum = (window as any).ethereum;
      const prov = new ethers.BrowserProvider(ethereum);
      const signer = await prov.getSigner();
      setProvider(prov);
      setSigner(signer);
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserData = async () => {
    if (!signer || !account) return;
    try {
      setIsLoading(true);
      const contract = getLendingContract(signer);
      const balance = await contract.collateralBalances(account);
      const [amount, userCollateral, isActive] = await contract.getLoanDetails(
        account
      );
      setCollateral(ethers.formatUnits(balance, 18));
      setLoan({
        amount: ethers.formatUnits(amount, 18),
        collateral: ethers.formatUnits(userCollateral, 18),
        isActive,
      });
    } catch (error) {
      toast({
        title: "Fetch Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransaction = async (
    action: (amount: string) => Promise<void>,
    amount: string,
    actionName: string
  ) => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await action(amount);
      toast({
        title: "Success",
        description: `${actionName} completed successfully`,
      });
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: `Failed to ${actionName.toLowerCase()}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deposit = async (amount: string) => {
    const contract = getLendingContract(signer);

    const tokenAddress = await contract.collateralToken();
    const token = new ethers.Contract(
      tokenAddress,
      [
        "function approve(address,uint256)",
        "function balanceOf(address) view returns (uint256)",
      ],
      signer
    );

    const amt = ethers.parseUnits(amount, 18);

    console.log(token.balanceOf(signer.getAddress()));
    await token.approve(contract.target, amt);
    await (await contract.depositCollateral(amt)).wait();

    fetchUserData();
  };

  const withdraw = async (amount: string) => {
    const contract = getLendingContract(signer);
    await (
      await contract.withdrawCollateral(ethers.parseUnits(amount, 18))
    ).wait();
    fetchUserData();
  };

  const takeLoan = async (amount: string) => {
    const contract = getLendingContract(signer);
    await (await contract.takeLoan(ethers.parseUnits(amount, 18))).wait();
    fetchUserData();
  };

  const repayLoan = async (amount: string) => {
    const contract = getLendingContract(signer);
    const token = new ethers.Contract(
      await contract.lendingToken(),
      ["function approve(address,uint256)"],
      signer
    );
    const amt = ethers.parseUnits(amount, 18);
    await token.approve(contract.target, amt);
    await (await contract.repayLoan(amt)).wait();
    fetchUserData();
  };

  useEffect(() => {
    if (account) {
      connectWallet();
    }
  }, [account]);

  useEffect(() => {
    if (account && signer) {
      fetchUserData();
    }
  }, [account, signer]);
  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to start lending and borrowing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SigpassKit />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold">Tizun Lend</CardTitle>
              </div>
              <Badge variant="outline" className="text-sm">
                <Wallet className="w-4 h-4 mr-1" />
                Connected
              </Badge>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Wallet:</span>
              <code className="bg-muted px-2 py-1 rounded text-xs">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </code>
            </div>
            <SigpassKit />
          </CardHeader>
        </Card>

        {/* Account Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available Collateral
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Number.parseFloat(collateral).toFixed(4)} CTK
              </div>
              <p className="text-xs text-muted-foreground">
                Ready to use as collateral
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
                {Number.parseFloat(loan.amount).toFixed(4)} LTK
              </div>
              <p className="text-xs text-muted-foreground">
                {loan.isActive ? "Currently borrowed" : "No active loan"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Loan Collateral
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Number.parseFloat(loan.collateral).toFixed(4)} CTK
              </div>
              <p className="text-xs text-muted-foreground">
                Locked as collateral
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Loan Status Alert */}
        {loan.isActive && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have an active loan of{" "}
              {Number.parseFloat(loan.amount).toFixed(4)} ETH with{" "}
              {Number.parseFloat(loan.collateral).toFixed(4)} ETH locked as
              collateral.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Collateral Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Collateral Management
              </CardTitle>
              <CardDescription>
                Deposit or withdraw your collateral
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ActionButton
                label="Deposit Collateral"
                onAction={(amount) =>
                  handleTransaction(deposit, amount, "Deposit")
                }
                icon={<TrendingUp className="w-4 h-4" />}
                variant="default"
                disabled={isLoading}
              />
              <ActionButton
                label="Withdraw Collateral"
                onAction={(amount) =>
                  handleTransaction(withdraw, amount, "Withdraw")
                }
                icon={<TrendingDown className="w-4 h-4" />}
                variant="outline"
                disabled={isLoading || Number.parseFloat(collateral) === 0}
              />
            </CardContent>
          </Card>

          {/* Loan Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Loan Management
              </CardTitle>
              <CardDescription>
                Take out loans or repay existing ones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ActionButton
                label="Take Loan"
                onAction={(amount) =>
                  handleTransaction(takeLoan, amount, "Take Loan")
                }
                icon={<TrendingUp className="w-4 h-4" />}
                variant="default"
                disabled={isLoading || Number.parseFloat(collateral) === 0}
              />
              <ActionButton
                label="Repay Loan"
                onAction={(amount) =>
                  handleTransaction(repayLoan, amount, "Repay Loan")
                }
                icon={<TrendingDown className="w-4 h-4" />}
                variant="outline"
                disabled={isLoading || !loan.isActive}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onAction,
  icon,
  variant = "default",
  disabled = false,
}: {
  label: string;
  onAction: (amount: string) => void;
  icon?: React.ReactNode;
  variant?: "default" | "outline";
  disabled?: boolean;
}) {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async () => {
    if (!input || Number.parseFloat(input) <= 0) return;

    setIsProcessing(true);
    try {
      await onAction(input);
      setInput("");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`input-${label}`} className="text-sm font-medium">
        {label}
      </Label>
      <div className="flex space-x-2">
        <Input
          id={`input-${label}`}
          placeholder="0.00"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="number"
          step="0.0001"
          min="0"
          disabled={disabled || isProcessing}
          className="flex-1"
        />
        <Button
          onClick={handleAction}
          variant={variant}
          disabled={
            disabled || isProcessing || !input || Number.parseFloat(input) <= 0
          }
          className="min-w-[120px]"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            icon && <span className="mr-2">{icon}</span>
          )}
          {isProcessing ? "Processing..." : label}
        </Button>
      </div>
    </div>
  );
}

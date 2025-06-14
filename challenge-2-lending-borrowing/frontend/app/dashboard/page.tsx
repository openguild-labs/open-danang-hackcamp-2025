"use client";
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Wallet, DollarSign, Shield, AlertCircle } from "lucide-react";
import DepositCollateral from "@/components/deposit-collateral";
import TakeLoan from "@/components/take-loan";
import RepayLoan from "@/components/repay-loan";
import WithdrawCollateral from "@/components/withdraw-collateral";
import UserPositions from "@/components/user-positions";

export default function DashboardPage() {
  const [activeAction, setActiveAction] = useState<string>("");

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collateral</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">Deposited collateral value</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">Outstanding loan amount</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Factor</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Safe</div>
            <p className="text-xs text-muted-foreground">Risk level indicator</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Actions Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                Manage your lending and borrowing positions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={activeAction} onValueChange={setActiveAction} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="supply">Supply</TabsTrigger>
                  <TabsTrigger value="borrow">Borrow</TabsTrigger>
                </TabsList>
                
                <TabsContent value="supply" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveAction("deposit")}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Deposit Collateral
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveAction("withdraw")}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Withdraw Collateral
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="borrow" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveAction("borrow")}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Take Loan
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveAction("repay")}
                    >
                      <TrendingDown className="mr-2 h-4 w-4" />
                      Repay Loan
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeAction === "deposit" && "Deposit Collateral"}
                {activeAction === "withdraw" && "Withdraw Collateral"}
                {activeAction === "borrow" && "Take Loan"}
                {activeAction === "repay" && "Repay Loan"}
                {!activeAction && "Your Positions"}
              </CardTitle>
              <CardDescription>
                {activeAction === "deposit" && "Deposit tokens as collateral to enable borrowing"}
                {activeAction === "withdraw" && "Withdraw your available collateral"}
                {activeAction === "borrow" && "Borrow tokens against your collateral"}
                {activeAction === "repay" && "Repay your outstanding loans"}
                {!activeAction && "Overview of your lending and borrowing positions"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeAction === "deposit" && <DepositCollateral />}
              {activeAction === "withdraw" && <WithdrawCollateral />}
              {activeAction === "borrow" && <TakeLoan />}
              {activeAction === "repay" && <RepayLoan />}
              {!activeAction && <UserPositions />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

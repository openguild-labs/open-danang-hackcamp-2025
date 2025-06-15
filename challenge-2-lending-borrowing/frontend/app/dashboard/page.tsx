"use client";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, DollarSign } from "lucide-react";

// Import action components
import LendingComponent from "@/components/lending-borrowing/lending";
import BorrowingComponent from "@/components/lending-borrowing/borrowing";

export default function DashboardPage() {
  const [activeAction, setActiveAction] = useState<string>("lending");

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your lending and borrowing activities
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Actions Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                Choose your action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant={activeAction === "lending" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setActiveAction("lending")}
              >
                <Shield className="mr-2 h-4 w-4" />
                Supply & Withdraw
              </Button>
              <Button
                variant={activeAction === "borrowing" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setActiveAction("borrowing")}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Borrow & Repay
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeAction === "lending" && "Supply & Withdraw"}
                {activeAction === "borrowing" && "Borrow & Repay"}
              </CardTitle>
              <CardDescription>
                {activeAction === "lending" && "Supply tokens to earn yield and use as collateral"}
                {activeAction === "borrowing" && "Borrow tokens against your collateral and repay loans"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeAction === "lending" && <LendingComponent />}
              {activeAction === "borrowing" && <BorrowingComponent />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
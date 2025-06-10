"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Settings, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const tokens = [
  { symbol: "ETH", name: "Ethereum", balance: "2.45", logo: "🔷" },
  { symbol: "USDC", name: "USD Coin", balance: "1,250.00", logo: "💵" },
  { symbol: "USDT", name: "Tether", balance: "500.00", logo: "💰" },
  { symbol: "DAI", name: "Dai Stablecoin", balance: "750.50", logo: "🟡" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", balance: "0.15", logo: "₿" },
];

export function SwapInterface() {
  const [fromToken, setFromToken] = useState(tokens[0]);
  const [toToken, setToToken] = useState(tokens[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const calculateSwap = (amount: string) => {
    if (!amount) return "";
    // Mock exchange rate calculation
    const rate = fromToken.symbol === "ETH" ? 2500 : 0.0004;
    return (Number.parseFloat(amount) * rate).toFixed(6);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    setToAmount(calculateSwap(value));
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Swap Tokens</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSlippage("0.1")}>
                Slippage: 0.1%
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSlippage("0.5")}>
                Slippage: 0.5%
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSlippage("1.0")}>
                Slippage: 1.0%
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* From Token */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>From</span>
              <span>Balance: {fromToken.balance}</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                className="flex-1"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 min-w-[120px]">
                    <span className="text-lg">{fromToken.logo}</span>
                    {fromToken.symbol}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {tokens.map((token) => (
                    <DropdownMenuItem
                      key={token.symbol}
                      onClick={() => setFromToken(token)}
                      className="gap-2"
                    >
                      <span className="text-lg">{token.logo}</span>
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-xs text-muted-foreground">
                          {token.name}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSwapTokens}
              className="rounded-full border"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>To</span>
              <span>Balance: {toToken.balance}</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="0.0"
                value={toAmount}
                readOnly
                className="flex-1 bg-muted"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 min-w-[120px]">
                    <span className="text-lg">{toToken.logo}</span>
                    {toToken.symbol}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {tokens.map((token) => (
                    <DropdownMenuItem
                      key={token.symbol}
                      onClick={() => setToToken(token)}
                      className="gap-2"
                    >
                      <span className="text-lg">{token.logo}</span>
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-xs text-muted-foreground">
                          {token.name}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Swap Details */}
          {fromAmount && (
            <div className="space-y-2 p-3 bg-muted rounded-lg text-sm">
              <div className="flex justify-between">
                <span>Rate</span>
                <span>
                  1 {fromToken.symbol} = {calculateSwap("1")} {toToken.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Slippage Tolerance</span>
                <Badge variant="secondary">{slippage}%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Network Fee</span>
                <span>~$5.20</span>
              </div>
            </div>
          )}

          <Button className="w-full" size="lg" disabled={!fromAmount}>
            {fromAmount ? "Swap Tokens" : "Enter Amount"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

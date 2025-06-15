"use client";

import SwapInterface from "@/components/swap-interface";
import LiquidityManagement from "@/components/liquidity-management";

export default function UniswapV2Page() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 py-24">
      <h1 className="text-4xl font-extrabold">Uniswap V2 DEX</h1>
      <p className="max-w-2xl text-center text-muted-foreground">
        Swap tokens and manage liquidity for the pair deployed on Paseo Asset Hub.
        Connect with MetaMask or Sigpass and interact directly with the Uniswap V2 core contracts.
      </p>

      <div className="flex w-full flex-col items-center gap-12 lg:flex-row lg:items-start lg:justify-center">
        <SwapInterface />
        <LiquidityManagement />
      </div>
    </div>
  );
}
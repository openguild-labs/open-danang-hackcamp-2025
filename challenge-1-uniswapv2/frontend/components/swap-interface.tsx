// SwapInterface – simple Uniswap V2 pair swap UI
"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useConfig,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { parseUnits, formatUnits, Address } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, PAIR_ADDRESS } from "@/lib/addresses";
import { uniswapPairAbi } from "@/lib/uniswapPairAbi";
import { erc20Abi } from "@/lib/abi";
import { getAmountOut } from "@/lib/uniswap";
import { useToast } from "@/hooks/use-toast";
import { paseoAssetHub, localConfig } from "@/app/providers";
import { useAtomValue } from "jotai";
import { addressAtom } from "./sigpasskit";

export default function SwapInterface() {
  const { toast } = useToast();
  const { address: evmAddress } = useAccount();
  const sigpassAddress = useAtomValue(addressAtom);
  const userAddress = sigpassAddress ?? evmAddress;

  const wagmiConfig = useConfig();

  // Reserves
  const {
    data: reservesData,
    refetch: refetchReserves,
  } = useReadContracts({
    contracts: [
      {
        address: PAIR_ADDRESS,
        abi: uniswapPairAbi,
        functionName: "getReserves",
      },
    ],
    watch: true,
  });

  const reserves = reservesData?.[0]?.result as
    | readonly [bigint, bigint, number]
    | undefined;

  // Direction: true = A → B, false = B → A
  const [direction, setDirection] = useState<true | false>(true);
  const [amountIn, setAmountIn] = useState<string>("");

  // Output calculation
  const amountOut = (() => {
    if (!reserves || amountIn === "") return "0";
    const [reserve0, reserve1] = reserves;
    const inAmount = parseUnits(amountIn || "0", 18);
    const out = direction
      ? getAmountOut(inAmount, reserve0, reserve1)
      : getAmountOut(inAmount, reserve1, reserve0);
    return formatUnits(out, 18);
  })();

  const { writeContractAsync, isPending } = useWriteContract({
    config: sigpassAddress ? localConfig : wagmiConfig,
  });

  async function handleSwap() {
    if (!userAddress || !reserves) {
      toast({ title: "Wallet not connected" });
      return;
    }
    try {
      const inToken: Address = direction ? TOKEN_A_ADDRESS : TOKEN_B_ADDRESS;
      const outToken: Address = direction ? TOKEN_B_ADDRESS : TOKEN_A_ADDRESS;
      const inParsed = parseUnits(amountIn, 18);
      const outParsed = parseUnits(amountOut, 18);

      // 1. Transfer tokenIn to pair
      await writeContractAsync({
        address: inToken,
        abi: erc20Abi,
        functionName: "transfer",
        args: [PAIR_ADDRESS, inParsed],
        chainId: paseoAssetHub.id,
      });

      // 2. Call swap
      await writeContractAsync({
        address: PAIR_ADDRESS,
        abi: uniswapPairAbi,
        functionName: "swap",
        args: direction
          ? [0n, outParsed, userAddress, "0x"]
          : [outParsed, 0n, userAddress, "0x"],
        chainId: paseoAssetHub.id,
      });

      toast({ title: "Swap submitted – waiting for confirmation…" });
      setAmountIn("");
      refetchReserves();
    } catch (err: unknown) {
      toast({ title: "Swap failed", description: (err as Error).message });
    }
  }

  return (
    <div className="w-full max-w-[420px] space-y-4 rounded-xl border border-border p-6">
      <h3 className="text-xl font-semibold">Swap</h3>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Amount {direction ? "Token A" : "Token B"}
        </label>
        <Input
          placeholder="0.0"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
        />
      </div>

      <Button
        variant="ghost"
        className="w-full"
        onClick={() => setDirection(!direction)}
      >
        ↕️ Switch direction
      </Button>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Estimated {direction ? "Token B" : "Token A"} received
        </label>
        <Input disabled value={amountOut} />
      </div>

      <Button
        onClick={handleSwap}
        disabled={amountIn === "" || isPending || !userAddress}
        className="w-full"
      >
        {isPending ? "Confirm in wallet…" : "Swap"}
      </Button>
    </div>
  );
}
// LiquidityManagement – add/remove liquidity UI
"use client";

import { useState } from "react";
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
import { erc20Abi } from "@/lib/abi";
import { uniswapPairAbi } from "@/lib/uniswapPairAbi";
import { useToast } from "@/hooks/use-toast";
import { paseoAssetHub, localConfig } from "@/app/providers";
import { useAtomValue } from "jotai";
import { addressAtom } from "./sigpasskit";

export default function LiquidityManagement() {
  const { toast } = useToast();
  const { address: evmAddress } = useAccount();
  const sigpassAddress = useAtomValue(addressAtom);
  const userAddress = sigpassAddress ?? evmAddress;
  const wagmiConfig = useConfig();

  // Pair stats
  const { data: pairStats, refetch } = useReadContracts({
    contracts: [
      {
        address: PAIR_ADDRESS,
        abi: uniswapPairAbi,
        functionName: "totalSupply",
      },
      {
        address: PAIR_ADDRESS,
        abi: uniswapPairAbi,
        functionName: "balanceOf",
        args: [userAddress ?? "0x0000000000000000000000000000000000000000"],
      },
    ],
    watch: true,
  });

  const totalSupply = pairStats?.[0]?.result as bigint | undefined;
  const myLpBalance = pairStats?.[1]?.result as bigint | undefined;

  // Form state
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [removeLp, setRemoveLp] = useState("");

  const { writeContractAsync, isPending } = useWriteContract({
    config: sigpassAddress ? localConfig : wagmiConfig,
  });

  async function addLiquidity() {
    if (!userAddress) {
      toast({ title: "Wallet not connected" });
      return;
    }
    try {
      const parsedA = parseUnits(amountA, 18);
      const parsedB = parseUnits(amountB, 18);

      // Transfers
      await writeContractAsync({
        address: TOKEN_A_ADDRESS,
        abi: erc20Abi,
        functionName: "transfer",
        args: [PAIR_ADDRESS, parsedA],
        chainId: paseoAssetHub.id,
      });
      await writeContractAsync({
        address: TOKEN_B_ADDRESS,
        abi: erc20Abi,
        functionName: "transfer",
        args: [PAIR_ADDRESS, parsedB],
        chainId: paseoAssetHub.id,
      });

      // Mint LP
      await writeContractAsync({
        address: PAIR_ADDRESS,
        abi: uniswapPairAbi,
        functionName: "mint",
        args: [userAddress],
        chainId: paseoAssetHub.id,
      });

      toast({ title: "Liquidity added" });
      setAmountA("");
      setAmountB("");
      refetch();
    } catch (e) {
      toast({ title: "Add liquidity failed", description: (e as Error).message });
    }
  }

  async function removeLiquidity() {
    if (!userAddress) {
      toast({ title: "Wallet not connected" });
      return;
    }
    try {
      const lpParsed = parseUnits(removeLp, 18);

      // Transfer LP tokens to pair
      await writeContractAsync({
        address: PAIR_ADDRESS,
        abi: uniswapPairAbi,
        functionName: "transfer",
        args: [PAIR_ADDRESS, lpParsed],
        chainId: paseoAssetHub.id,
      });

      // Burn
      await writeContractAsync({
        address: PAIR_ADDRESS,
        abi: uniswapPairAbi,
        functionName: "burn",
        args: [userAddress],
        chainId: paseoAssetHub.id,
      });

      toast({ title: "Liquidity removed" });
      setRemoveLp("");
      refetch();
    } catch (e) {
      toast({
        title: "Remove liquidity failed",
        description: (e as Error).message,
      });
    }
  }

  return (
    <div className="w-full max-w-[420px] space-y-6 rounded-xl border border-border p-6">
      <h3 className="text-xl font-semibold">Liquidity</h3>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Total LP&nbsp;tokens:{" "}
          {totalSupply ? formatUnits(totalSupply, 18) : "…"}
        </p>
        <p className="text-sm text-muted-foreground">
          Your LP&nbsp;balance:{" "}
          {myLpBalance ? formatUnits(myLpBalance, 18) : "…"}
        </p>
      </div>

      <hr className="border-border" />

      <h4 className="font-medium">Add liquidity</h4>
      <div className="space-y-2">
        <Input
          placeholder="Token A amount"
          value={amountA}
          onChange={(e) => setAmountA(e.target.value)}
        />
        <Input
          placeholder="Token B amount"
          value={amountB}
          onChange={(e) => setAmountB(e.target.value)}
        />
        <Button
          onClick={addLiquidity}
          disabled={!amountA || !amountB || isPending || !userAddress}
          className="w-full"
        >
          {isPending ? "Confirm in wallet…" : "Add"}
        </Button>
      </div>

      <hr className="border-border" />

      <h4 className="font-medium">Remove liquidity</h4>
      <div className="space-y-2">
        <Input
          placeholder="LP amount"
          value={removeLp}
          onChange={(e) => setRemoveLp(e.target.value)}
        />
        <Button
          onClick={removeLiquidity}
          disabled={!removeLp || isPending || !userAddress}
          className="w-full"
        >
          {isPending ? "Confirm in wallet…" : "Remove"}
        </Button>
      </div>
    </div>
  );
}
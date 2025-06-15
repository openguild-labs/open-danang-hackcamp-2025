"use client";

import { ReactNode } from "react";
import { useAccount } from "wagmi";
import { useAtomValue } from "jotai";
import { addressAtom } from "@/components/sigpasskit";

/**
 * Wrapper that blocks access to its children until the user connects a wallet.
 * Considers both RainbowKit‑connected wallets (wagmi) and SigpassKit wallets.
 */
export default function RequireWallet({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const sigpassAddr = useAtomValue(addressAtom);
  const isConnected = Boolean(address || sigpassAddr);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
        <p className="text-lg font-medium">
          Please connect your wallet first to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
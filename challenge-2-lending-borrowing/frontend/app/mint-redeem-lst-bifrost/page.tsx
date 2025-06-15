"use client";

import RequireWallet from "@/components/require-wallet";
import MintRedeemLstBifrost from "@/components/mint-redeem-lst-bifrost";

export default function MintRedeemLstBifrostPage() {
  return (
    <RequireWallet>
      <div className="flex flex-col gap-8 max-w-[768px] mx-auto min-h-screen items-center justify-center">
        <h1 className="text-2xl font-bold">Mint/Redeem LST Bifrost</h1>
        <MintRedeemLstBifrost />
      </div>
    </RequireWallet>
  );
}
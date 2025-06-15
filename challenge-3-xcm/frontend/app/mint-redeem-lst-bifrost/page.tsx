"use client";
import MintRedeemLstBifrost from "@/components/mint-redeem-lst-bifrost";

export default function MintRedeemLstBifrostPage() {
  return (
    <div className="mx-auto flex max-w-[768px] flex-col items-center justify-center gap-8 py-20">
      <h1 className="text-3xl font-bold">Mint / Redeem LST (Bifrost)</h1>
      <MintRedeemLstBifrost />
    </div>
  );
}
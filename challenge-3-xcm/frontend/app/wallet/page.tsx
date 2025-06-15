"use client";
import SigpassKit from "@/components/sigpasskit";

export default function WalletPage() {
  return (
    <div className="mx-auto flex max-w-[768px] flex-col items-center justify-center gap-8 py-20">
      <h1 className="text-3xl font-bold">Wallet</h1>
      <SigpassKit />
    </div>
  );
}
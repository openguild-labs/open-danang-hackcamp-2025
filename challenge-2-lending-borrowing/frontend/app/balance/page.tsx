"use client";

import RequireWallet from "@/components/require-wallet";

export default function BalancePage() {
  return (
    <RequireWallet>
      <div className="flex flex-col gap-8 max-w-[768px] mx-auto min-h-screen items-center justify-center">
        <h1 className="text-2xl font-bold">Balance</h1>
      </div>
    </RequireWallet>
  );
}
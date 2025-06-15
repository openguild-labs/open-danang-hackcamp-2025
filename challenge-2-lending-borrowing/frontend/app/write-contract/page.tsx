"use client";

import RequireWallet from "@/components/require-wallet";
import WriteContract from "@/components/write-contract";

export default function WriteContractPage() {
  return (
    <RequireWallet>
      <div className="flex flex-col gap-8 max-w-[768px] mx-auto min-h-screen items-center justify-center">
        <h1 className="text-2xl font-bold">Write Contract</h1>
        <WriteContract />
      </div>
    </RequireWallet>
  );
}
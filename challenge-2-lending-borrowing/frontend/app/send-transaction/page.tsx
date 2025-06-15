"use client";

import RequireWallet from "@/components/require-wallet";
import SendTransaction from "@/components/send-transaction";

export default function SendTransactionPage() {
  return (
    <RequireWallet>
      <div className="flex flex-col gap-8 max-w-[768px] mx-auto min-h-screen items-center justify-center">
        <h1 className="text-2xl font-bold">Send Transaction</h1>
        <SendTransaction />
      </div>
    </RequireWallet>
  );
}
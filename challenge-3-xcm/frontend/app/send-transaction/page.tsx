"use client";
import SendTransaction from "@/components/send-transaction";

export default function SendTransactionPage() {
  return (
    <div className="mx-auto flex max-w-[768px] flex-col items-center justify-center gap-8 py-20">
      <h1 className="text-3xl font-bold">Send Transaction</h1>
      <SendTransaction />
    </div>
  );
}
"use client";
import WriteContract from "@/components/write-contract";

export default function WriteContractPage() {
  return (
    <div className="mx-auto flex max-w-[768px] flex-col items-center justify-center gap-8 py-20">
      <h1 className="text-3xl font-bold">Write Contract</h1>
      <WriteContract />
    </div>
  );
}
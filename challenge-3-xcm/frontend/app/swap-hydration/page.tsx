"use client";
import SwapHydration from "@/components/swap-hydration";

export default function SwapHydrationPage() {
  return (
    <div className="mx-auto flex max-w-[768px] flex-col items-center justify-center gap-8 py-20">
      <h1 className="text-3xl font-bold">Swap Token on Hydration</h1>
      <SwapHydration />
    </div>
  );
}
"use client";

import PortfolioCard from "@/components/portfolio-card";

export default function BalancePage() {
  return (
    <div className="mx-auto flex max-w-[768px] flex-col items-center gap-8 py-24">
      <h1 className="text-3xl font-bold">Balance</h1>
      <PortfolioCard />
    </div>
  );
}
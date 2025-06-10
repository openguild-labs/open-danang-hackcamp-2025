"use client";

import { Header } from "@/components/common/header";
import { SwapInterface } from "@/components/pages/swap-page";
import { useState } from "react";
// import { Sidebar } from "@/components/sidebar";
// import { SwapInterface } from "@/components/swap-interface";
// import { LiquidityInterface } from "@/components/liquidity-interface";
// import { Portfolio } from "@/components/portfolio";
// import { TransactionHistory } from "@/components/transaction-history";

export default function Home() {
  const [activeTab, setActiveTab] = useState("swap");

  const renderContent = () => {
    switch (activeTab) {
      case "swap":
        return <SwapInterface />;
      // case "liquidity":
      //   return <LiquidityInterface />;
      // case "portfolio":
      //   return <Portfolio />;
      // case "history":
      //   return <TransactionHistory />;
      default:
        return <SwapInterface />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} /> */}
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">{renderContent()}</main>
      </div>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";

const XCM = dynamic(() => import("@/components/xcm/NFT"), {
  ssr: false,
});

export default function VestingPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
        Crosschain NFT Marketplace
      </h1>
      <XCM />
    </div>
  );
}

"use client";

import { BarChart } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Props {
  vEthRate: string;
  vDotRate: string;
  apy?: string;
}

export default function YieldSnapshotCard({
  vEthRate,
  vDotRate,
  apy,
}: Props) {
  return (
    <Card className="w-full backdrop-blur-sm border bg-muted/40 border-border dark:bg-black/40 dark:border-white/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <BarChart className="w-5 h-5" />
          Yield Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-row justify-between">
          <p className="text-sm text-muted-foreground">vETH / ETH</p>
          <p className="text-xl font-semibold">{vEthRate}</p>
        </div>
        <div className="flex flex-row justify-between">
          <p className="text-sm text-muted-foreground">vDOT / DOT</p>
          <p className="text-xl font-semibold">{vDotRate}</p>
        </div>
        {apy && (
          <div className="flex flex-row justify-between">
            <p className="text-sm text-muted-foreground">Estimated&nbsp;APY</p>
            <p className="text-xl font-semibold">{apy}%</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
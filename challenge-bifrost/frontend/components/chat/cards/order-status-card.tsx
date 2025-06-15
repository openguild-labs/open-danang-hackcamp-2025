"use client";

import { Clock, LoaderCircle, CheckCircle, XCircle } from "lucide-react";
import { truncateHash } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Props {
  status: "pending" | "processing" | "completed" | "failed";
  txHash?: string;
  amount?: string;
  token?: string;
}

const ICONS = {
  pending: Clock,
  processing: LoaderCircle,
  completed: CheckCircle,
  failed: XCircle,
} as const;

const LABELS = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
} as const;

export default function OrderStatusCard({
  status,
  txHash,
  amount,
  token,
}: Props) {
  const Icon = ICONS[status];

  return (
    <Card className="w-full backdrop-blur-sm border bg-muted/40 border-border dark:bg-black/40 dark:border-white/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          Order Status
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-row gap-2 items-center">
          <span className="text-sm font-medium">Status:</span>
          <span className="px-2 py-0.5 rounded-full bg-muted/20 text-xs">
            {LABELS[status]}
          </span>
        </div>

        {amount && token && (
          <div className="flex flex-row gap-2 items-center">
            <span className="text-sm font-medium">Amount:</span>
            <span>
              {amount} {token}
            </span>
          </div>
        )}

        {txHash && (
          <div className="flex flex-row gap-2 items-center">
            <span className="text-sm font-medium">Tx&nbsp;Hash:</span>
            <span className="font-mono">{truncateHash(txHash)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
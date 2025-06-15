"use client";

import { Bot, User, RefreshCw } from "lucide-react";

import type { AiChatMessage } from "@/types/shared";
import { cn } from "@/lib/utils";

import OrderStatusCard from "./cards/order-status-card";
import YieldSnapshotCard from "./cards/yield-snapshot-card";
import TokenBalanceCard from "./cards/token-balance-card";
import EmptyCard from "./empty-card";

interface Props {
  message: AiChatMessage;
}

export default function ChatMessage({ message }: Props) {
  const { role, content } = message;

  /* ----------------------------- custom cards ---------------------------- */
  if (content === "ORDER_STATUS") {
    return (
      <OrderStatusCard
        status={message.state as any}
        txHash={message.txHash}
        amount={message.amount}
        token={message.token}
      />
    );
  }

  if (content === "YIELD_SNAPSHOT") {
    return (
      <YieldSnapshotCard
        vEthRate={message.vEthRate}
        vDotRate={message.vDotRate}
        apy={message.apy}
      />
    );
  }

  if (content === "TOKEN_BALANCE") {
    const balances = message.balanceData ?? [];
    if (balances.length) {
      return (
        <TokenBalanceCard
          title={message.chartTitle || "Token Balances"}
          balances={balances}
          summary={message.summary}
        />
      );
    }
    return (
      <EmptyCard
        icon={RefreshCw}
        title={message.chartTitle || "Token Balances"}
        subtitle="No token balances found"
      />
    );
  }

  if (content === "API_REQUEST") {
    return (
      <EmptyCard
        icon={RefreshCw}
        title={message.chartTitle || "Fetching data"}
        subtitle="Querying API…"
      />
    );
  }

  /* ----------------------------- chat bubble ---------------------------- */
  const bubbleClass = cn(
    "py-3 px-4 rounded-2xl whitespace-pre-wrap border",
    role === "user"
      ? "bg-muted/10 border-border"
      : "dark:bg-black/30 bg-muted/20 border-border"
  );

  return (
    <div
      className={`flex ${role === "user" ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`flex max-w-[80%] ${
          role === "user" ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div
          className={`rounded-full h-9 w-9 flex items-center justify-center bg-muted/20 dark:bg-white/10 border border-border dark:border-white/10 ${
            role === "user" ? "ml-2" : "mr-2"
          }`}
        >
          {role === "user" ? (
            <User className="h-4 w-4 text-foreground/80 dark:text-white/80" />
          ) : (
            <Bot className="h-4 w-4 text-foreground/80 dark:text-white/80" />
          )}
        </div>
        <div className={bubbleClass}>
          {role === "user" ? (
            content
          ) : (
            <div
              className="prose prose-invert text-white"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
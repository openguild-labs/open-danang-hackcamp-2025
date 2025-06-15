"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  resetChat: () => void;
  loading: boolean;
}

export default function ChatToolbar({ resetChat, loading }: Props) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-3xl font-bold text-foreground">AI Chat</h1>

      <Button
        variant="outline"
        size="sm"
        className="gap-1 border-white/20 hover:bg-white/10 text-white"
        onClick={resetChat}
        disabled={loading}
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        New Chat
      </Button>
    </div>
  );
}

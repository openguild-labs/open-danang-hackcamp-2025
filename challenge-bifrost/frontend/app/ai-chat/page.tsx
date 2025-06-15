"use client";

import { Send } from "lucide-react";
import { useAiChat } from "@/hooks/use-ai-chat";
import ChatMessage from "@/components/chat/chat-message";
import ChatSuggestions from "@/components/chat/chat-suggestions";
import ChatToolbar from "@/components/chat/chat-toolbar";
import { Button } from "@/components/ui/button";
import { SUGGESTIONS } from "@/lib/ai/chat-ui";
import type { AiChatMessage } from "@/types/shared";

/* -------------------------------------------------------------------------- */
/*                               Page component                               */
/* -------------------------------------------------------------------------- */

export default function AiChatPage() {
  const { messages, input, setInput, loading, send, reset } = useAiChat();

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-10">
      {/* Header & reset */}
      <ChatToolbar resetChat={reset} loading={loading} />

      {/* Messages */}
      <div className="h-[65vh] w-full overflow-auto rounded-xl border border-border bg-muted/5 p-4">
        {messages.map((m: AiChatMessage, i: number) => (
          <ChatMessage key={i} message={m} />
        ))}
      </div>

      {/* Prompt input */}
      <div className="relative">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask Bifrost AI…"
          className="w-full rounded-xl border border-border bg-background py-3 pl-4 pr-16 focus:outline-none"
          disabled={loading}
        />
        <Button
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2"
          onClick={send}
          disabled={!input.trim() || loading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Suggestions */}
      <ChatSuggestions
        suggestions={SUGGESTIONS}
        onSelect={setInput}
        disabled={loading}
      />
    </section>
  )
}
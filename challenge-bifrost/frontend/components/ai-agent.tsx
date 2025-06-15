"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { useAiChat } from "@/hooks/use-ai-chat";
import ChatMessage from "@/components/chat/chat-message";
import ChatSuggestions from "@/components/chat/chat-suggestions";
import ChatToolbar from "@/components/chat/chat-toolbar";

import { Button } from "@/components/ui/button";
import { AiAgentContext } from "@/hooks/use-ai-agent-context";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { SUGGESTIONS } from "@/lib/ai/chat-ui";

interface AiAgentProps {
  initialPrompt?: string;
}

export default function AiAgent({ initialPrompt }: AiAgentProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(false);

  const { messages, input, setInput, loading, send, reset } = useAiChat();

  // helper to open with optional seed prompt
  const openWithPrompt = (prompt?: string) => {
    if (prompt) setInput(prompt);
    setOpen(true);
  };

  // auto-seed initialPrompt when dialog opens
  useEffect(() => {
    if (open && initialPrompt) setInput(initialPrompt);
  }, [open, initialPrompt, setInput]);

  /* ------------------------------- chat window ------------------------------ */
  const chatWindow = (
    <div className="flex h-full flex-col">
      <ChatToolbar resetChat={reset} loading={loading} />

      <div className="mb-4 flex-1 overflow-auto rounded-md border border-border bg-muted/5 p-4">
        {messages.map((m, i) => (
          <ChatMessage key={i} message={m} />
        ))}
      </div>

      <div className="mb-2">
        <div className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask Bifrost AI…"
            className="w-full rounded-md border border-border bg-background py-3 px-4 pr-16 focus:outline-none"
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

        <ChatSuggestions
          suggestions={SUGGESTIONS}
          onSelect={setInput}
          disabled={loading}
        />
      </div>
    </div>
  );

  /* --------------------------------- render -------------------------------- */
  return (
    <AiAgentContext.Provider value={{ open: openWithPrompt }}>
      <>
        <Button
          onClick={() => setOpen(true)}
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg transition-transform hover:scale-105"
        >
          <MessageSquare className="h-6 w-6 text-white" />
        </Button>

        {isDesktop ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="ai-agent-layer flex h-[85vh] w-[90vw] max-w-3xl flex-col">
              <DialogHeader>
                <DialogTitle>Bifrost AI Assistant</DialogTitle>
              </DialogHeader>

              {chatWindow}

              <DialogFooter className="pt-2">
                <DialogClose asChild>
                  <Button variant="outline">
                    <X className="mr-1 h-4 w-4" /> Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent className="ai-agent-layer h-[92vh] flex flex-col">
              <DrawerHeader>
                <DrawerTitle>Bifrost AI Assistant</DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-1 overflow-hidden px-4">
                {chatWindow}
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </>
    </AiAgentContext.Provider>
  );
}
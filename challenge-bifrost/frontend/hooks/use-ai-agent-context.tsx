"use client";

import { createContext, useContext } from "react";

export interface AiAgentDispatcher {
  /** Open the global AI assistant with an optional pre-filled prompt */
  open: (prompt?: string) => void;
}

export const AiAgentContext = createContext<AiAgentDispatcher>({
  // fallback no-op to avoid undefined errors before provider is mounted
  open: () => {},
});

export function useAiAgentContext() {
  return useContext(AiAgentContext);
}
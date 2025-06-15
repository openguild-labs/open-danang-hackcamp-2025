"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { bifrostAgent } from "@/lib/openai"
import type { AiChatMessage } from "@/types/shared"

/* -------------------------------------------------------------------------- */
/*                                   Static                                   */
/* -------------------------------------------------------------------------- */

const INITIAL_GREETING: AiChatMessage = {
  role: "system",
  content:
    "Hi there 👋 I’m Bifrost AI. Ask me to mint, redeem, track orders or check prices!",
}

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface UseAiChat {
  messages: AiChatMessage[]
  input: string
  setInput: (v: string) => void
  loading: boolean
  send: () => Promise<void>
  reset: () => void
}

/* -------------------------------------------------------------------------- */
/*                                    Hook                                    */
/* -------------------------------------------------------------------------- */

export function useAiChat(): UseAiChat {
  const { address } = useAccount()
  const [messages, setMessages] = useState<AiChatMessage[]>([
    INITIAL_GREETING,
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  /** Append a new message to state */
  const append = (m: AiChatMessage) =>
    setMessages((prev: AiChatMessage[]) => [...prev, m])

  /** Start a fresh conversation */
  const reset = () => setMessages([INITIAL_GREETING])

  /* ---------------------------------------------------------------------- */
  /*                                   Send                                 */
  /* ---------------------------------------------------------------------- */
  const send = async () => {
    const prompt = input.trim()
    if (!prompt || loading) return

    append({ role: "user", content: prompt })
    setInput("")
    setLoading(true)

    /* Visible thinking placeholder */
    const placeholder: AiChatMessage = {
      role: "system",
      content: "Processing…",
    }
    append(placeholder)

    try {
      const intentSpec = await bifrostAgent(prompt)
      const type = intentSpec?.type as string

      let response = ""

      switch (type) {
        case "mint":
          response =
            "To mint, open the Mint component, choose your token and amount, then confirm the transaction in your wallet."
          break
        case "redeem":
          response =
            "To redeem, use the Redeem component, select the voucher token and amount, and submit the order."
          break
        case "track_order":
          response = `Tracking order ${
            intentSpec.order_id ?? "(unknown)"
          }… please check the 'Track' section for real-time status.`
          break
        case "token_price":
          response = `Current price lookup for ${
            intentSpec.token_symbol ?? "the token"
          } is not yet connected — stay tuned!`
          break
        case "portfolio":
          response = address
            ? `Fetching portfolio data for ${address}… (feature coming soon).`
            : "Connect your wallet to view portfolio data."
          break
        default:
          response =
            intentSpec?.message ||
            "I’m not sure how to help with that — please try rephrasing."
          break
      }

      /* Swap placeholder for final answer */
      setMessages((prev: AiChatMessage[]) => {
        const idx = prev.findIndex((m) => m.content === "Processing…")
        const next = [...prev]
        next[idx] = { role: "system", content: response }
        return next
      })
    } catch (err: any) {
      setMessages((prev: AiChatMessage[]) => {
        const idx = prev.findIndex((m) => m.content === "Processing…")
        const next = [...prev]
        next[idx] = { role: "system", content: `Error: ${err.message}` }
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  /* ---------------------------------------------------------------------- */

  return { messages, input, setInput, loading, send, reset }
}
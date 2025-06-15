import OpenAI from "openai";

/* -------------------------------------------------------------------------- */
/*                           Runtime client management                        */
/* -------------------------------------------------------------------------- */

const isServer = typeof window === "undefined";
let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!isServer) {
    throw new Error("OpenAI SDK must not be instantiated in the browser");
  }
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing required environment variable: OPENAI_API_KEY");
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

/* -------------------------------------------------------------------------- */
/*                         Agent & context system prompts                     */
/* -------------------------------------------------------------------------- */

const INTENTS = [
  "mint",
  "redeem",
  "track_order",
  "token_price",
  "portfolio",
] as const;

const AGENT_SYSTEM_PROMPT = `You are Bifrost AI's intent parser.
Translate each user request into **exactly one** JSON object, with the following schema:

{
  "type": "<${INTENTS.join(" | ")} | general_answer>",
  "token_symbol": "<optional, e.g. ETH, DOT, vDOT>",
  "amount": "<optional human number; use string if present>",
  "order_id": "<only for track_order>",
  "message": "<short fallback answer when type is general_answer>"
}

Rules:
1. Choose the \`type\` that best matches the request; if none fits, use \`general_answer\`.
2. token_symbol is **uppercase** with no whitespace.
3. Omit keys that are not relevant to the chosen type (except \`type\`).
4. Return **only** the raw JSON with no markdown, no extra keys, no commentary.
`;

async function chatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
) {
  const completion = await getClient().chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.2,
  });
  return completion.choices[0]?.message?.content ?? "";
}

/* -------------------------------------------------------------------------- */
/*                             Server-side helpers                            */
/* -------------------------------------------------------------------------- */

async function bifrostAgentInternal(userQuery: string): Promise<any> {
  const messages = [
    { role: "system", content: AGENT_SYSTEM_PROMPT },
    { role: "user", content: userQuery },
  ];
  const rawText = await chatCompletion(messages as any[]);
  try {
    const jsonMatch = rawText.match(/{[\s\S]*}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { type: "general_answer", message: rawText.trim() };
  } catch {
    return { type: "general_answer", message: rawText.trim() };
  }
}

/* -------------------------------------------------------------------------- */
/*                                Public API                                  */
/* -------------------------------------------------------------------------- */

export async function bifrostAgent(userQuery: string): Promise<any> {
  if (isServer) return bifrostAgentInternal(userQuery);
  const res = await fetch("/api/openai/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: userQuery }),
  });
  if (!res.ok) throw new Error(`OpenAI agent error: ${res.status}`);
  return res.json();
}
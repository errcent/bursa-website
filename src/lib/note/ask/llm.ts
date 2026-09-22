/**
 * BYOK LLM callers for Ask Your Journal (read-only Q&A).
 *
 * Keys come from the request (user-owned, never stored) or server env.
 * Upstream bodies are never relayed on error; prompts carry redacted
 * aggregates only. Hard timeouts + output caps on every call.
 */

export type AskProvider = "anthropic" | "openai";

const FETCH_TIMEOUT_MS = 25_000;

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Model provider rejected the request (HTTP ${res.status}).`);
    return (await res.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

export const ASK_SYSTEM_PROMPT =
  "You answer questions about the trader's own journal aggregates. " +
  "Use ONLY the aggregates and citations provided. " +
  "Every factual claim must cite one of the provided citations verbatim. " +
  "Never invent trades, numbers, or dates. " +
  "Keep answers under 120 words. Not investment advice.";

export async function callAnthropic(opts: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
}): Promise<string> {
  const json = (await postJson(
    "https://api.anthropic.com/v1/messages",
    { "x-api-key": opts.apiKey, "anthropic-version": "2023-06-01" },
    { model: opts.model, max_tokens: 400, system: opts.system, messages: [{ role: "user", content: opts.user }] },
  )) as { content?: Array<{ text?: string }> };
  const text = json?.content?.map((b) => b.text ?? "").join("").trim();
  if (!text) throw new Error("Empty model response.");
  return text.slice(0, 1200);
}

export async function callOpenAI(opts: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
}): Promise<string> {
  const json = (await postJson(
    "https://api.openai.com/v1/chat/completions",
    { Authorization: `Bearer ${opts.apiKey}` },
    {
      model: opts.model,
      max_tokens: 400,
      temperature: 0.2,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    },
  )) as { choices?: Array<{ message?: { content?: string } }> };
  const text = json?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty model response.");
  return text.slice(0, 1200);
}

export async function embedOpenAI(apiKey: string, texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const json = (await postJson(
    "https://api.openai.com/v1/embeddings",
    { Authorization: `Bearer ${apiKey}` },
    { model: "text-embedding-3-small", input: texts.slice(0, 10).map((t) => t.slice(0, 1000)) },
  )) as { data?: Array<{ embedding?: number[] }> };
  return (json?.data ?? []).map((d) => (Array.isArray(d.embedding) ? d.embedding : [])).filter((e) => e.length > 0);
}

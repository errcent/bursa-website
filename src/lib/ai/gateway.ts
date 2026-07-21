import { db } from "@/lib/db";

import { AI_CONFIG } from "./config";

const MAX_PROMPT_CHARS = AI_CONFIG.maxContextTokens * 4;
const MAX_OUTPUT_CHARS = 5000;
const GATEWAY_TIMEOUT_MS = 8000;

function redactForLlm(text: string): string {
  return text
    .replace(/sk-[a-zA-Z0-9]{20,}/g, "[REDACTED_KEY]")
    .replace(/Bearer\s+[a-zA-Z0-9.\-_]+/gi, "[REDACTED_TOKEN]")
    .replace(/[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g, "[REDACTED_JWT]")
    .replace(/process\.env\.[A-Z0-9_]+/g, "[REDACTED_ENV]")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi, "[REDACTED_EMAIL]")
    .replace(/[A-Za-z0-9]{32,}/g, "[REDACTED_LONG_STRING]");
}

function sanitizeLlmOutput(text: string): string {
  return text
    .replace(/sk-[a-zA-Z0-9]{20,}/g, "[REDACTED]")
    .replace(/Bearer\s+[a-zA-Z0-9.\-_]+/gi, "[REDACTED]")
    .replace(/[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g, "[REDACTED]");
}

function assertNoSensitiveLeak(text: string): void {
  const patterns = [
    /sk-[a-zA-Z0-9]{20,}/,
    /Bearer\s+[a-zA-Z0-9.\-_]+/i,
    /process\.env\./,
    /[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/,
  ];

  for (const pattern of patterns) {
    if (pattern.test(text)) {
      throw new Error("Sensitive data leak detected in AI output");
    }
  }
}

function assertNoSensitiveKeywords(text: string): void {
  const checkText = text.replace(/\[[^\]]+\]/g, "");
  if (/\bapi key\b/i.test(checkText)) {
    throw new Error("Sensitive keyword detected in AI output");
  }
  if (/\bsecret\b/i.test(checkText)) {
    throw new Error("Sensitive keyword detected in AI output");
  }
  if (/\btoken\b/i.test(checkText)) {
    throw new Error("Sensitive keyword detected in AI output");
  }
  if (/\benv\b/i.test(checkText)) {
    throw new Error("Sensitive keyword detected in AI output");
  }
}

async function logUsage(
  userId: string,
  inputChars: number,
  outputChars: number
): Promise<void> {
  await db.aiUsageLog.create({
    data: {
      userId,
      feature: "SUPPORT_BOT",
      model: AI_CONFIG.agentModel,
      inputTokens: Math.ceil(inputChars / 4),
      outputTokens: Math.ceil(outputChars / 4),
    },
  });
}

export async function callAiGateway(input: {
  prompt: string;
  userId: string;
}): Promise<string> {
  const gatewayUrl = process.env.AI_GATEWAY_URL?.trim();
  if (!gatewayUrl) {
    throw new Error("AI_GATEWAY_URL not configured");
  }

  const sanitized = redactForLlm(input.prompt);

  if (sanitized.length > MAX_PROMPT_CHARS) {
    throw new Error("Prompt too large");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(gatewayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: sanitized }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("AI gateway request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error(`AI gateway error: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Invalid AI response type");
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid JSON from AI gateway");
  }

  if (!data || typeof data !== "object" || typeof (data as { output?: unknown }).output !== "string") {
    throw new Error("Invalid AI response");
  }

  const safeOutput = sanitizeLlmOutput((data as { output: string }).output);
  const fullySanitized = redactForLlm(safeOutput);

  if (!fullySanitized.trim()) {
    throw new Error("Empty AI response blocked");
  }

  if (fullySanitized.length > MAX_OUTPUT_CHARS) {
    throw new Error("AI output too large");
  }

  assertNoSensitiveLeak(fullySanitized);
  assertNoSensitiveKeywords(fullySanitized);

  await logUsage(input.userId, sanitized.length, fullySanitized.length);

  return fullySanitized;
}

/**
 * AI feature config — blueprint only; routes return 503 until enabled.
 */

export const AI_ENABLED =
  process.env.AI_FEATURE_ENABLED === "true" ||
  process.env.AI_FEATURE_ENABLED === "1";

export const AI_CONFIG = {
  gatewayUrl: process.env.AI_GATEWAY_URL ?? "",
  routerModel: process.env.AI_MODEL_ROUTER ?? "gpt-4o-mini",
  agentModel: process.env.AI_MODEL_AGENT ?? "gpt-4o",
  dailyTokenBudgetPerUser: Number(
    process.env.AI_DAILY_TOKEN_BUDGET_PER_USER ?? "10000"
  ),
  ragTopK: 3,
  maxContextTokens: 2500,
} as const;

export function assertAiEnabled(): void {
  if (!AI_ENABLED) {
    throw new Error("AI_FEATURE_DISABLED");
  }
}

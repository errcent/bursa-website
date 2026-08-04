import {
  getTurnstileSecretKey,
  isTurnstileRequiredInProduction,
  isTurnstileServerEnabled,
  warnIfTurnstileMisconfigured,
} from "@/lib/turnstile/config";

export function isTurnstileConfigured(): boolean {
  if (isTurnstileRequiredInProduction()) {
    return isTurnstileServerEnabled();
  }
  return isTurnstileServerEnabled();
}

export function isTurnstileBlockingMisconfiguration(): boolean {
  return isTurnstileRequiredInProduction() && !isTurnstileServerEnabled();
}

export async function verifyTurnstileToken(
  token: string | undefined,
  ip: string
): Promise<boolean> {
  warnIfTurnstileMisconfigured();

  const secret = getTurnstileSecretKey();
  if (!secret) return true;

  if (!token?.trim()) return false;

  const body = new URLSearchParams({
    secret,
    response: token.trim(),
    remoteip: ip,
  });

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }
  );

  if (!response.ok) {
    console.warn(`[turnstile] siteverify HTTP ${response.status}`);
    return false;
  }

  const data = (await response.json()) as {
    success?: boolean;
    hostname?: string;
    "error-codes"?: string[];
  };

  if (data.success !== true) {
    // Surfaces causes like invalid-input-secret / timeout-or-duplicate in Vercel logs.
    console.warn(
      `[turnstile] siteverify rejected token: ${data["error-codes"]?.join(", ") || "unknown"}` +
        (data.hostname ? ` (hostname: ${data.hostname})` : "")
    );
    return false;
  }

  return true;
}

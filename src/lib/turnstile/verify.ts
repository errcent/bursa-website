import {
  getTurnstileSecretKey,
  isTurnstileServerEnabled,
  warnIfTurnstileMisconfigured,
} from "@/lib/turnstile/config";

export function isTurnstileConfigured(): boolean {
  return isTurnstileServerEnabled();
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

  if (!response.ok) return false;

  const data = (await response.json()) as { success?: boolean };
  return data.success === true;
}

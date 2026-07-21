/** Cloudflare Turnstile — visible widget, always passes (dev/test only). */
export const TURNSTILE_TEST_SITE_KEY = "2x00000000000000000000AB";
export const TURNSTILE_TEST_SECRET_KEY = "2x0000000000000000000000000000000AA";

export function getTurnstileSiteKey(): string | undefined {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || undefined;
}

export function getTurnstileSecretKey(): string | undefined {
  return process.env.TURNSTILE_SECRET_KEY?.trim() || undefined;
}

/** Server-side: both keys required before enforcing verification. */
export function isTurnstileServerEnabled(): boolean {
  return Boolean(getTurnstileSiteKey() && getTurnstileSecretKey());
}

/** Client-side: widget renders when the public site key is set. */
export function isTurnstileClientEnabled(): boolean {
  return Boolean(getTurnstileSiteKey());
}

export function warnIfTurnstileMisconfigured(): void {
  const hasSite = Boolean(getTurnstileSiteKey());
  const hasSecret = Boolean(getTurnstileSecretKey());
  if (hasSite !== hasSecret) {
    console.warn(
      "[turnstile] Misconfigured: set BOTH NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY, or leave both empty."
    );
  }
}

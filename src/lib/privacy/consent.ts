export const CONSENT_STORAGE_KEY = "bursa-cookie-consent";
export const CONSENT_EVENT = "bursa-cookie-consent";
export const VISITOR_ID_KEY = "bursa-visitor-id";
export const CONSENT_POLICY_VERSION = "2026-07";

export type CookieCategory = "essential" | "functional" | "analytics";

export type CookieConsentCategories = {
  essential: true;
  functional: boolean;
  analytics: boolean;
};

export type ConsentPayload = {
  essential: true;
  functional: boolean;
  analytics: boolean;
};

export function categoriesFromLegacy(value: string | null): CookieConsentCategories {
  if (value === "accepted") {
    return { essential: true, functional: true, analytics: true };
  }
  return { essential: true, functional: false, analytics: false };
}

export function readStoredCategories(value: string | null): CookieConsentCategories | null {
  if (!value) return null;
  if (value === "accepted" || value === "essential-only") {
    return categoriesFromLegacy(value);
  }
  try {
    const parsed = JSON.parse(value) as Partial<CookieConsentCategories>;
    if (typeof parsed.analytics === "boolean") {
      return {
        essential: true,
        functional: parsed.functional === true,
        analytics: parsed.analytics,
      };
    }
  } catch {
    /* ignore malformed storage */
  }
  return null;
}

export function serializeConsentCategories(categories: CookieConsentCategories): string {
  return JSON.stringify({
    essential: true,
    functional: categories.functional,
    analytics: categories.analytics,
  });
}

export function legacyFromCategories(categories: CookieConsentCategories): "accepted" | "essential-only" {
  if (categories.analytics) return "accepted";
  return "essential-only";
}

export function hasAnalyticsConsent(categories: CookieConsentCategories): boolean {
  return categories.analytics === true;
}

"use client";

import { useEffect } from "react";

import { initPostHog } from "@/lib/analytics/posthog";
import {
  CONSENT_EVENT,
  CONSENT_STORAGE_KEY,
  hasAnalyticsConsent,
  readStoredCategories,
} from "@/lib/privacy/consent";

function storageAllowsAnalytics(): boolean {
  try {
    return hasAnalyticsConsent(readStoredCategories(localStorage.getItem(CONSENT_STORAGE_KEY)) ?? {
      essential: true,
      functional: false,
      analytics: false,
    });
  } catch {
    return false;
  }
}

export function PostHogProvider() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()) return;

    function maybeInit() {
      if (storageAllowsAnalytics()) {
        void initPostHog();
      }
    }

    maybeInit();

    function onConsent(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      const categories = readStoredCategories(typeof detail === "string" ? detail : null);
      if (categories && hasAnalyticsConsent(categories)) {
        void initPostHog();
      }
    }

    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  return null;
}

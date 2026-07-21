"use client";

import { useEffect } from "react";

import { initPostHog } from "@/lib/analytics/posthog";

const CONSENT_KEY = "bursa-cookie-consent";
const CONSENT_EVENT = "bursa-cookie-consent";

function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function PostHogProvider() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()) return;

    function maybeInit() {
      if (hasAnalyticsConsent()) {
        void initPostHog();
      }
    }

    maybeInit();

    function onConsent(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      if (detail === "accepted") {
        void initPostHog();
      }
    }

    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  return null;
}

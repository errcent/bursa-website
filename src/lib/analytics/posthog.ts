"use client";

import type { PostHog } from "posthog-js";

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog | null {
  return posthogClient;
}

export async function initPostHog(): Promise<PostHog | null> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";

  if (!key || posthogClient) return posthogClient;

  const { default: posthog } = await import("posthog-js");
  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
  });
  posthogClient = posthog;
  return posthogClient;
}

export function captureAnalyticsEvent(
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>
): void {
  posthogClient?.capture(event, properties);
}

"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { captureAnalyticsEvent } from "@/lib/analytics/posthog";

/** Fires landing_view once per pathname (+ utm). */
export function LandingViewTracker({ page }: { page?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const utm: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "experiment_id"]) {
      const v = searchParams.get(key);
      if (v) utm[key] = v;
    }
    captureAnalyticsEvent("landing_view", {
      path: pathname,
      page: page ?? pathname,
      ...utm,
    });
  }, [pathname, page, searchParams]);

  return null;
}

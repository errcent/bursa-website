"use client";

import { useEffect } from "react";

import { captureAnalyticsEvent } from "@/lib/analytics/posthog";

export function CourseViewTracker({
  courseId,
  priceIdr,
  experimentId,
}: {
  courseId: string;
  priceIdr?: number;
  experimentId?: string;
}) {
  useEffect(() => {
    captureAnalyticsEvent("course_view", {
      course_id: courseId,
      price_idr: priceIdr ?? null,
      experiment_id: experimentId ?? null,
    });
    if (typeof priceIdr === "number" && priceIdr > 0) {
      captureAnalyticsEvent("price_impression", {
        price_idr: priceIdr,
        course_id: courseId,
        experiment_id: experimentId ?? null,
        source: "course_detail",
      });
    }
  }, [courseId, priceIdr, experimentId]);

  return null;
}

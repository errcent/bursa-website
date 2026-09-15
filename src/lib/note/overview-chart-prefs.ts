import {
  jakartaDateKey,
  rangeForPreset,
  rangeWithinSingleCalendarMonth,
  type EconDateRange,
} from "@/lib/note/economic-calendar/date-range";

import type { PnlStackGranularity } from "@/lib/note/stats";

export type OverviewChartPrefs = {
  range: EconDateRange;
  granularity: PnlStackGranularity;
  hideEmptyDays: boolean;
};

const STORAGE_KEY = "note-overview-chart-v1";

export function defaultOverviewChartPrefs(): OverviewChartPrefs {
  return {
    range: rangeForPreset("this_month", jakartaDateKey()),
    granularity: "day",
    hideEmptyDays: true,
  };
}

export function loadOverviewChartPrefs(): OverviewChartPrefs {
  if (typeof window === "undefined") return defaultOverviewChartPrefs();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultOverviewChartPrefs();
    const parsed = JSON.parse(raw) as Partial<OverviewChartPrefs>;
    const base = defaultOverviewChartPrefs();
    const range = parsed.range?.from && parsed.range?.to ? parsed.range : base.range;
    let granularity =
      parsed.granularity === "month" || parsed.granularity === "day" || parsed.granularity === "trade"
        ? parsed.granularity
        : base.granularity;
    if (rangeWithinSingleCalendarMonth(range) && granularity === "month") {
      granularity = "day";
    }
    return {
      range,
      granularity,
      hideEmptyDays: parsed.hideEmptyDays ?? base.hideEmptyDays,
    };
  } catch {
    return defaultOverviewChartPrefs();
  }
}

export function saveOverviewChartPrefs(prefs: OverviewChartPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

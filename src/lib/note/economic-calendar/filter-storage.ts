import {
  sanitizeFilterState,
  type EconomicCalendarFilterState,
} from "@/lib/note/economic-calendar/filters";

export const ECON_FILTER_STORAGE_KEY = "note-econ-filter-v2";

export function loadEconomicFilter(fallback: EconomicCalendarFilterState): EconomicCalendarFilterState {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(ECON_FILTER_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<EconomicCalendarFilterState>;
    return sanitizeFilterState(parsed, fallback);
  } catch {
    return fallback;
  }
}

export function saveEconomicFilter(filter: EconomicCalendarFilterState) {
  localStorage.setItem(ECON_FILTER_STORAGE_KEY, JSON.stringify(filter));
}

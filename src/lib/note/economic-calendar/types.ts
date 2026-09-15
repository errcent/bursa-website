import type { EconomicEventType } from "@/lib/note/economic-calendar/event-type";

export type EconomicImpact = "high" | "medium" | "low" | "holiday" | "unknown";

export type EconomicEventSource =
  | "forexfactory_json"
  | "forexfactory_xml"
  | "scraper_api"
  | "scrape_snapshot"
  | "month_snapshot";

export type EconomicEvent = {
  id: string;
  title: string;
  currency: string;
  date: string;
  timeLabel: string;
  /** UTC instant for countdown (ISO). */
  startsAt: string | null;
  impact: EconomicImpact;
  eventType: EconomicEventType;
  forecast: string | null;
  previous: string | null;
  actual: string | null;
  url: string | null;
  source: EconomicEventSource;
};

export type EconomicCalendarCoverage = {
  from: string;
  to: string;
  complete: boolean;
  daysInRange: number;
  daysWithEvents: number;
  note?: string;
};

export type EconomicCalendarFeatures = {
  /** Note Plus style volatility-weighted countdown phases. */
  volatilityCountdown: boolean;
  pollIntervalSec: number;
};

export type EconomicCalendarPayload = {
  provider: EconomicEventSource | "none";
  fetchedAt: string;
  serverTime: string;
  events: EconomicEvent[];
  nearestEventId: string | null;
  disclaimer: string;
  coverage: EconomicCalendarCoverage;
  features: EconomicCalendarFeatures;
};

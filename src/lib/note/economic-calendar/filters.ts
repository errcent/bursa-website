import type { EconomicEvent, EconomicImpact } from "@/lib/note/economic-calendar/types";
import type { EconomicEventType } from "@/lib/note/economic-calendar/event-type";

/** Currencies shown on Forex Factory filter panel (same set). */
export const ECON_FILTER_CURRENCIES = [
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "EUR",
  "GBP",
  "JPY",
  "NZD",
  "USD",
] as const;

export type EconFilterCurrency = (typeof ECON_FILTER_CURRENCIES)[number];

export const ECON_FILTER_IMPACTS: EconomicImpact[] = ["high", "medium", "low", "holiday"];

export const ECON_FILTER_EVENT_TYPES: EconomicEventType[] = [
  "growth",
  "inflation",
  "employment",
  "central_bank",
  "bonds",
  "housing",
  "consumer_surveys",
  "business_surveys",
  "speeches",
  "misc",
];

export type EconomicCalendarFilterState = {
  impacts: EconomicImpact[];
  currencies: EconFilterCurrency[];
  eventTypes: EconomicEventType[];
};

/** Forex Factory style default: USD + high impact, all event types. */
export const DEFAULT_ECON_FILTER: EconomicCalendarFilterState = {
  impacts: ["high"],
  currencies: ["USD"],
  eventTypes: [...ECON_FILTER_EVENT_TYPES],
};

/** News tab: show scraped month window (user narrows via FF filter panel). */
export const NEWS_MONTH_FILTER: EconomicCalendarFilterState = {
  impacts: [...ECON_FILTER_IMPACTS],
  currencies: [...ECON_FILTER_CURRENCIES],
  eventTypes: [...ECON_FILTER_EVENT_TYPES],
};

export function sanitizeFilterState(
  partial: Partial<EconomicCalendarFilterState> | null | undefined,
  fallback: EconomicCalendarFilterState = DEFAULT_ECON_FILTER
): EconomicCalendarFilterState {
  if (!partial) return { ...fallback };
  return {
    impacts: partial.impacts?.length ? [...partial.impacts] : [...fallback.impacts],
    currencies: partial.currencies?.length ? [...partial.currencies] : [...fallback.currencies],
    eventTypes: partial.eventTypes?.length ? [...partial.eventTypes] : [...fallback.eventTypes],
  };
}

export function parseCsvList(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseFilterFromSearchParams(params: {
  impacts?: string | null;
  currencies?: string | null;
  eventTypes?: string | null;
  /** Legacy single impact query */
  impact?: string | null;
  /** Legacy single currency */
  currency?: string | null;
}): EconomicCalendarFilterState {
  const impactsRaw = parseCsvList(params.impacts);
  const legacyImpact = params.impact?.trim();
  let impacts: EconomicImpact[] =
    impactsRaw.length > 0
      ? impactsRaw.filter((v): v is EconomicImpact =>
          (ECON_FILTER_IMPACTS as string[]).includes(v)
        )
      : legacyImpact && legacyImpact !== "all"
        ? legacyImpact === "high" ||
            legacyImpact === "medium" ||
            legacyImpact === "low" ||
            legacyImpact === "holiday"
          ? [legacyImpact]
          : DEFAULT_ECON_FILTER.impacts
        : DEFAULT_ECON_FILTER.impacts;

  const currenciesRaw = parseCsvList(params.currencies);
  const legacyCurrency = params.currency?.trim()?.toUpperCase();
  let currencies: EconFilterCurrency[] =
    currenciesRaw.length > 0
      ? currenciesRaw.filter((c): c is EconFilterCurrency =>
          (ECON_FILTER_CURRENCIES as readonly string[]).includes(c)
        )
      : legacyCurrency && legacyCurrency !== "ALL"
        ? (ECON_FILTER_CURRENCIES as readonly string[]).includes(legacyCurrency)
          ? [legacyCurrency as EconFilterCurrency]
          : DEFAULT_ECON_FILTER.currencies
        : DEFAULT_ECON_FILTER.currencies;

  const typesRaw = parseCsvList(params.eventTypes);
  let eventTypes: EconomicEventType[] =
    typesRaw.length > 0
      ? typesRaw.filter((t): t is EconomicEventType =>
          (ECON_FILTER_EVENT_TYPES as string[]).includes(t)
        )
      : [...DEFAULT_ECON_FILTER.eventTypes];

  if (!impacts.length) impacts = [...DEFAULT_ECON_FILTER.impacts];
  if (!currencies.length) currencies = [...DEFAULT_ECON_FILTER.currencies];
  if (!eventTypes.length) eventTypes = [...DEFAULT_ECON_FILTER.eventTypes];

  return { impacts, currencies, eventTypes };
}

export function filterEventsByState(
  events: EconomicEvent[],
  filter: EconomicCalendarFilterState
): EconomicEvent[] {
  const impactSet = new Set(filter.impacts);
  const currencySet = new Set(filter.currencies.map((c) => c.toUpperCase()));
  const typeSet = new Set(filter.eventTypes);
  const allTypes = filter.eventTypes.length >= ECON_FILTER_EVENT_TYPES.length;

  return events.filter((e) => {
    if (!impactSet.has(e.impact)) return false;
    const cur = e.currency.toUpperCase();
    if (cur === "ALL") {
      if (!filter.impacts.includes("low") && e.impact === "low") return false;
    } else if (!currencySet.has(cur)) {
      return false;
    }
    if (!allTypes && !typeSet.has(e.eventType)) return false;
    return true;
  });
}

export function filterStateToQuery(filter: EconomicCalendarFilterState): Record<string, string> {
  return {
    impacts: filter.impacts.join(","),
    currencies: filter.currencies.join(","),
    eventTypes: filter.eventTypes.join(","),
  };
}

export function isDefaultFilter(filter: EconomicCalendarFilterState): boolean {
  return (
    filter.impacts.length === DEFAULT_ECON_FILTER.impacts.length &&
    filter.impacts.every((i) => DEFAULT_ECON_FILTER.impacts.includes(i)) &&
    filter.currencies.length === 1 &&
    filter.currencies[0] === "USD" &&
    filter.eventTypes.length === ECON_FILTER_EVENT_TYPES.length
  );
}

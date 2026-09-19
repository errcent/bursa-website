"use client";

import { CalendarDays, ChevronDown, ExternalLink, Radio, Timer } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { EconomicCalendarTable } from "@/components/note/economic-calendar-table";
import { NoteNewsCharts } from "@/components/note/note-news-charts";
import { useEconomicCountdown } from "@/components/note/use-economic-countdown";
import { apiEnvelopeForRange, eventInRange } from "@/lib/note/economic-calendar/date-range";
import {
  NoteEconomicDateRange,
  useEconDateRange,
} from "@/components/note/note-economic-date-range";
import { pickNearestEvent } from "@/lib/note/economic-calendar/countdown";
import {
  loadEconomicFilter,
  saveEconomicFilter,
} from "@/lib/note/economic-calendar/filter-storage";
import {
  DEFAULT_ECON_FILTER,
  ECON_FILTER_CURRENCIES,
  ECON_FILTER_EVENT_TYPES,
  ECON_FILTER_IMPACTS,
  NEWS_MONTH_FILTER,
  filterStateToQuery,
  isDefaultFilter,
  type EconomicCalendarFilterState,
} from "@/lib/note/economic-calendar/filters";
import { filterEventsBySensitivity, type AssetSensitivity } from "@/lib/note/economic-calendar/sensitivity";
import type { EconomicCalendarPayload } from "@/lib/note/economic-calendar/types";
import { noteCopy } from "@/lib/note/copy";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

const IMPACT_DOT: Record<string, string> = {
  high: "bg-[var(--chart-down-strong)]",
  medium: "note-dot-warn",
  low: "bg-[var(--chart-warn-muted)]",
  holiday: "bg-violet-400",
  unknown: "bg-zinc-600",
};

function FilterSection({
  title,
  children,
  onAll,
  onNone,
  allLabel,
  noneLabel,
}: {
  title: string;
  children: ReactNode;
  onAll: () => void;
  onNone: () => void;
  allLabel: string;
  noneLabel: string;
}) {
  return (
    <fieldset className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <legend className="text-xs font-medium uppercase tracking-wide text-zinc-400">{title}</legend>
        <span className="text-xs text-zinc-400">
          <button type="button" className="hover:text-zinc-300" onClick={onAll}>
            {allLabel}
          </button>
          {" · "}
          <button type="button" className="hover:text-zinc-300" onClick={onNone}>
            {noneLabel}
          </button>
        </span>
      </div>
      {children}
    </fieldset>
  );
}

export function NoteEconomicCalendar({
  compact = false,
  sensitivity = null,
  monthScope = false,
  monthHint,
  showCharts = false,
  filter: controlledFilter,
  onFilterCommit,
}: {
  compact?: boolean;
  sensitivity?: AssetSensitivity | null;
  /** News tab: request full local month + relaxed default filter */
  monthScope?: boolean;
  monthHint?: string;
  /** News: TradingView block inside this card, tied to committed currency filter. */
  showCharts?: boolean;
  /** When set, filter is controlled by parent (e.g. News charts sync). */
  filter?: EconomicCalendarFilterState;
  onFilterCommit?: (filter: EconomicCalendarFilterState) => void;
}) {
  const filterFallback = monthScope ? NEWS_MONTH_FILTER : DEFAULT_ECON_FILTER;
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const [internalFilter, setInternalFilter] = useState<EconomicCalendarFilterState>(filterFallback);
  const filter = controlledFilter ?? internalFilter;
  const [draft, setDraft] = useState<EconomicCalendarFilterState>(filter);
  const [filterOpen, setFilterOpen] = useState(false);
  const [data, setData] = useState<EconomicCalendarPayload | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useEconDateRange();

  useEffect(() => {
    if (controlledFilter) {
      setDraft(controlledFilter);
      return;
    }
    const loaded = loadEconomicFilter(filterFallback);
    setInternalFilter(loaded);
    setDraft(loaded);
  }, [filterFallback, controlledFilter]);

  const commitFilter = (next: EconomicCalendarFilterState) => {
    if (onFilterCommit) onFilterCommit(next);
    else {
      setInternalFilter(next);
      saveEconomicFilter(next);
    }
  };

  const fetchCalendar = useCallback(() => {
    const q = new URLSearchParams({
      locale: prefs.locale,
      volatility: "1",
      ...filterStateToQuery(filter),
    });
    if (monthScope) {
      const envelope = apiEnvelopeForRange(dateRange);
      q.set("from", envelope.from);
      q.set("to", envelope.to);
    }
    return fetch(`/api/note/economic-calendar?${q}`, { cache: "no-store", credentials: "include" })
      .then((r) => {
        if (!r.ok) {
          setFetchError(r.status === 401 ? "auth" : "http");
          return null;
        }
        setFetchError(null);
        return r.json();
      })
      .then((json: EconomicCalendarPayload | null) => {
        setData(json);
      });
  }, [prefs.locale, filter, monthScope, dateRange]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchCalendar().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchCalendar]);

  useEffect(() => {
    const sec = data?.features.pollIntervalSec ?? 120;
    const id = window.setInterval(() => {
      void fetchCalendar();
    }, sec * 1000);
    return () => window.clearInterval(id);
  }, [data?.features.pollIntervalSec, fetchCalendar]);

  const filteredEvents = useMemo(() => {
    let events = data?.events ?? [];
    if (monthScope) {
      events = events.filter((e) => eventInRange(e.date, dateRange));
    }
    return filterEventsBySensitivity(events, sensitivity);
  }, [data, sensitivity, monthScope, dateRange]);

  const nearest = useMemo(() => {
    const nowMs = data?.serverTime ? Date.parse(data.serverTime) : Date.now();
    return pickNearestEvent(filteredEvents, nowMs);
  }, [data?.serverTime, filteredEvents]);

  const volatilityAware = data?.features.volatilityCountdown ?? true;
  const countdown = useEconomicCountdown(nearest, prefs.locale, volatilityAware, data?.serverTime ?? null);

  const visible = useMemo(() => {
    if (compact) return filteredEvents.slice(0, 12);
    return filteredEvents;
  }, [filteredEvents, compact]);

  const scrollToNext = useCallback(() => {
    if (!data?.nearestEventId) return;
    document.getElementById(`econ-row-${data.nearestEventId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [data?.nearestEventId]);

  const tableLabels = useMemo(
    () => ({
      date: copy.econColDate,
      time: copy.econColTime,
      currency: copy.econColCurrency,
      impact: copy.econColImpact,
      event: copy.econColEvent,
      detail: copy.econColDetail,
      actual: copy.econColActual,
      forecast: copy.econColForecast,
      previous: copy.econColPrevious,
    }),
    [copy]
  );

  const filterToggle = !compact ? (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-300 hover:text-zinc-100"
      onClick={() => {
        setDraft(filter);
        setFilterOpen((o) => !o);
      }}
    >
      {copy.filter}
      {!isDefaultFilter(filter) && !monthScope ? <span className="note-dot-warn size-1.5 rounded-full" /> : null}
      <ChevronDown className={cn("size-3.5 transition", filterOpen && "rotate-180")} />
    </button>
  ) : null;

  const applyDraft = () => {
    commitFilter(draft);
    setFilterOpen(false);
  };

  const resetFilter = () => {
    setDraft(filterFallback);
    commitFilter(filterFallback);
    setFilterOpen(false);
  };

  const impactLabel = (k: string) => copy.econImpactLabels[k as keyof typeof copy.econImpactLabels] ?? k;
  const typeLabel = (k: string) => copy.econTypeLabels[k as keyof typeof copy.econTypeLabels] ?? k;

  return (
    <section className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4 sm:p-5">
      {monthHint ? <p className="mb-3 text-xs leading-relaxed text-zinc-400">{monthHint}</p> : null}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <CalendarDays className="size-4 text-zinc-400" aria-hidden />
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-400">{copy.econCalendar}</h2>
        {data?.provider && data.provider !== "none" ? (
          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs uppercase text-zinc-400">
            {data.provider === "scrape_snapshot" || data.provider === "forexfactory_json"
              ? "scrape"
              : data.provider}
          </span>
        ) : null}
        {!compact ? (
          <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
            {filterToggle}
            {monthScope ? <NoteEconomicDateRange value={dateRange} onChange={setDateRange} /> : null}
          </div>
        ) : null}
      </div>

      {nearest && countdown ? (
        <div className="note-surface-warn mb-4 rounded-lg border p-3">
          <div className="flex items-start gap-2">
            <Timer className="note-warn-muted mt-0.5 size-4 shrink-0 opacity-80" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-zinc-400">{copy.econNextEvent}</p>
              <p className="truncate text-sm font-medium text-zinc-100">{nearest.title}</p>
              <p className="text-xs text-zinc-400">
                {nearest.currency} · {nearest.timeLabel}
              </p>
            </div>
            <p
              className={cn(
                "max-w-[9.5rem] shrink-0 text-right text-xs font-semibold leading-snug tabular-nums sm:max-w-none sm:text-sm",
                countdown.phase === "live" || countdown.phase === "now"
                  ? "note-pnl-down"
                  : "note-warn-body"
              )}
            >
              {countdown.label}
            </p>
          </div>
          {volatilityAware && countdown.heavyHighImpact ? (
            <p className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
              <Radio className="note-warn size-3 opacity-80" />
              {copy.econVolatilityHint}
            </p>
          ) : null}
        </div>
      ) : null}

      {showCharts && !compact ? (
        <div className="mb-4 border-b border-zinc-800/70 pb-4">
          <NoteNewsCharts filterCurrencies={filter.currencies} embedded />
        </div>
      ) : null}

      {filterOpen && !compact ? (
        <div className="mb-4 space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
          <FilterSection
            title={copy.econFilterImpact}
            allLabel={copy.econAll}
            noneLabel={copy.econNone}
            onAll={() => setDraft((d) => ({ ...d, impacts: [...ECON_FILTER_IMPACTS] }))}
            onNone={() => setDraft((d) => ({ ...d, impacts: [] }))}
          >
            <div className="grid grid-cols-2 gap-1.5">
              {ECON_FILTER_IMPACTS.map((impact) => (
                <label key={impact} className="flex items-center gap-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={draft.impacts.includes(impact)}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        impacts: e.target.checked
                          ? [...d.impacts, impact]
                          : d.impacts.filter((x) => x !== impact),
                      }))
                    }
                  />
                  <span className={cn("size-2 rounded-full", IMPACT_DOT[impact])} />
                  {impactLabel(impact)}
                </label>
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title={copy.econFilterTypes}
            allLabel={copy.econAll}
            noneLabel={copy.econNone}
            onAll={() => setDraft((d) => ({ ...d, eventTypes: [...ECON_FILTER_EVENT_TYPES] }))}
            onNone={() => setDraft((d) => ({ ...d, eventTypes: [] }))}
          >
            <div className="grid grid-cols-2 gap-1.5">
              {ECON_FILTER_EVENT_TYPES.map((t) => (
                <label key={t} className="flex items-center gap-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={draft.eventTypes.includes(t)}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        eventTypes: e.target.checked
                          ? [...d.eventTypes, t]
                          : d.eventTypes.filter((x) => x !== t),
                      }))
                    }
                  />
                  {typeLabel(t)}
                </label>
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title={copy.econFilterCurrencies}
            allLabel={copy.econAll}
            noneLabel={copy.econNone}
            onAll={() => setDraft((d) => ({ ...d, currencies: [...ECON_FILTER_CURRENCIES] }))}
            onNone={() => setDraft((d) => ({ ...d, currencies: [] }))}
          >
            <div className="grid grid-cols-3 gap-1.5">
              {ECON_FILTER_CURRENCIES.map((c) => (
                <label key={c} className="flex items-center gap-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={draft.currencies.includes(c)}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        currencies: e.target.checked
                          ? [...d.currencies, c]
                          : d.currencies.filter((x) => x !== c),
                      }))
                    }
                  />
                  {c}
                </label>
              ))}
            </div>
          </FilterSection>

          {showCharts && draft.currencies.length > 0 && draft.currencies.length < ECON_FILTER_CURRENCIES.length ? (
            <p className="text-xs text-zinc-400">
              {copy.newsChartsOnApply}{" "}
              <span className="font-medium text-zinc-400">
                {draft.currencies.slice(0, 4).join(" · ")}
              </span>
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-900 hover:bg-white"
              onClick={applyDraft}
            >
              {copy.econApplyFilter}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-md border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-zinc-800"
              onClick={() => {
                setDraft(filter);
                setFilterOpen(false);
              }}
            >
              {copy.batal}
            </button>
            <button type="button" className="inline-flex min-h-11 items-center text-xs text-zinc-400 hover:text-zinc-200" onClick={resetFilter}>
              {copy.econRemoveFilter}
            </button>
          </div>
        </div>
      ) : null}

      {fetchError === "auth" ? (
        <p className="text-sm text-zinc-400">
          {prefs.locale === "en" ? "Sign in to load the calendar." : "Masuk untuk memuat kalender."}
        </p>
      ) : loading ? (
        <p className="text-xs text-zinc-400">…</p>
      ) : visible.length ? (
        <EconomicCalendarTable
          events={visible}
          locale={prefs.locale}
          labels={tableLabels}
          nearestEventId={nearest?.id ?? data?.nearestEventId}
          countdownLabel={countdown?.label ?? null}
          onUpNext={scrollToNext}
        />
      ) : (
        <div className="rounded-md border border-dashed border-zinc-800/90 bg-zinc-950/40 px-4 py-6 text-center">
          <p className="text-sm text-zinc-400">{copy.econEmpty}</p>
          {!compact ? (
            <p className="mt-2 text-xs text-zinc-400">
              {prefs.locale === "en"
                ? "Use Filter above to widen impact, event type, or currency, then Apply."
                : "Pakai Filter di atas untuk melonggarkan impact, jenis event, atau mata uang, lalu Terapkan."}
            </p>
          ) : null}
        </div>
      )}

      {data?.coverage && !data.coverage.complete && data.coverage.note ? (
        <p className="mt-2 text-xs text-zinc-400">{data.coverage.note}</p>
      ) : null}

      <p className="mt-3 text-xs leading-snug text-zinc-400">{data?.disclaimer ?? copy.econDisclaimer}</p>
      <a
        href="https://www.forexfactory.com/calendar"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
      >
        Forex Factory <ExternalLink className="size-3" />
      </a>
    </section>
  );
}

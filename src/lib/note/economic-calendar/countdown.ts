import { eventStartsAtMs } from "@/lib/note/economic-calendar/event-datetime";
import type { EconomicEvent } from "@/lib/note/economic-calendar/types";
import {
  isHeavyHighImpact,
  volatilityCountdownConfig,
  type VolatilityCountdownConfig,
} from "@/lib/note/economic-calendar/volatility-weight";

export type CountdownPhase = "far" | "mid" | "soon" | "live" | "now";

export type EventCountdownView = {
  phase: CountdownPhase;
  label: string;
  /** Client should re-render after this many ms. */
  tickMs: number;
  msToEvent: number;
  heavyHighImpact: boolean;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatHoursMinutes(ms: number, locale: "id" | "en"): string {
  const totalMin = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (locale === "en") {
    if (h > 0 && m > 0) return `in ${h}h ${m}m`;
    if (h > 0) return `in ${h}h`;
    return `in ${m}m`;
  }
  if (h > 0 && m > 0) return `dalam ${h}j ${m}m`;
  if (h > 0) return `dalam ${h}j`;
  return `dalam ${m}m`;
}

function formatMinutesSeconds(ms: number, locale: "id" | "en", live: boolean): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const core = `${min}m ${pad2(sec)}s`;
  if (locale === "en") {
    return live ? `in ${core} (live)` : `in ${core}`;
  }
  return live ? `dalam ${core} (live)` : `dalam ${core}`;
}

function formatSinceRelease(msSince: number, locale: "id" | "en"): string {
  const totalSec = Math.max(0, Math.floor(msSince / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (locale === "en") {
    if (min > 0) return `+${min}m ${pad2(sec)}s since release`;
    return `+${sec}s since release`;
  }
  if (min > 0) return `+${min}m ${pad2(sec)}s sejak rilis`;
  return `+${sec}s sejak rilis`;
}

export function formatEventCountdown(
  event: EconomicEvent,
  nowMs: number,
  locale: "id" | "en",
  volatilityAware: boolean
): EventCountdownView | null {
  const startsMs = eventStartsAtMs(event);
  if (startsMs == null) return null;

  const msToEvent = startsMs - nowMs;
  const config = volatilityCountdownConfig(event, volatilityAware);
  const heavy = volatilityAware && isHeavyHighImpact(event);

  if (msToEvent <= 0) {
    const since = Math.abs(msToEvent);
    const postWindowMs = heavy ? 20 * 60 * 1000 : 15 * 60 * 1000;
    if (since > postWindowMs) return null;
    const nowLabel = locale === "en" ? "NOW" : "SEKARANG";
    return {
      phase: "now",
      label: `${nowLabel} · ${formatSinceRelease(since, locale)}`,
      tickMs: 1000,
      msToEvent,
      heavyHighImpact: heavy,
    };
  }

  const twoHours = 120 * 60 * 1000;

  if (msToEvent > twoHours) {
    return {
      phase: "far",
      label: formatHoursMinutes(msToEvent, locale),
      tickMs: 60_000,
      msToEvent,
      heavyHighImpact: heavy,
    };
  }

  if (msToEvent > config.phase3Ms) {
    return {
      phase: "mid",
      label: formatHoursMinutes(msToEvent, locale),
      tickMs: 60_000,
      msToEvent,
      heavyHighImpact: heavy,
    };
  }

  if (!config.allowSeconds) {
    return {
      phase: "mid",
      label: formatHoursMinutes(msToEvent, locale),
      tickMs: 60_000,
      msToEvent,
      heavyHighImpact: false,
    };
  }

  if (msToEvent > config.phase4Ms) {
    return {
      phase: "soon",
      label: formatMinutesSeconds(msToEvent, locale, false),
      tickMs: 1000,
      msToEvent,
      heavyHighImpact: heavy,
    };
  }

  return {
    phase: "live",
    label: formatMinutesSeconds(msToEvent, locale, true),
    tickMs: 1000,
    msToEvent,
    heavyHighImpact: heavy,
  };
}

export function pickNearestEvent(events: EconomicEvent[], nowMs: number): EconomicEvent | null {
  const recentPastMs = 30 * 60 * 1000;
  let bestFuture: EconomicEvent | null = null;
  let bestFutureDelta = Number.POSITIVE_INFINITY;
  let bestPast: EconomicEvent | null = null;
  let bestPastDelta = Number.NEGATIVE_INFINITY;

  for (const e of events) {
    const ms = eventStartsAtMs(e);
    if (ms == null) continue;
    const delta = ms - nowMs;
    if (delta > 0 && delta < bestFutureDelta) {
      bestFutureDelta = delta;
      bestFuture = e;
    } else if (delta <= 0 && delta >= -recentPastMs && delta > bestPastDelta) {
      bestPastDelta = delta;
      bestPast = e;
    }
  }

  return bestFuture ?? bestPast ?? null;
}

export function suggestedPollMs(view: EventCountdownView | null): number {
  if (!view) return 120_000;
  if (view.phase === "live" || view.phase === "now") return 15_000;
  if (view.phase === "soon") return 30_000;
  return 120_000;
}

export { volatilityCountdownConfig, type VolatilityCountdownConfig };

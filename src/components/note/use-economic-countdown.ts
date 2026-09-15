"use client";

import { useEffect, useState } from "react";

import { formatEventCountdown, type EventCountdownView } from "@/lib/note/economic-calendar/countdown";
import type { EconomicEvent } from "@/lib/note/economic-calendar/types";

export function useEconomicCountdown(
  event: EconomicEvent | null,
  locale: "id" | "en",
  volatilityAware: boolean,
  serverTimeIso: string | null
) {
  const [view, setView] = useState<EventCountdownView | null>(null);

  useEffect(() => {
    if (!event) {
      setView(null);
      return;
    }
    const serverOffset = serverTimeIso ? Date.parse(serverTimeIso) - Date.now() : 0;
    let intervalId = 0;

    const tick = () => {
      const nowMs = Date.now() + serverOffset;
      const next = formatEventCountdown(event, nowMs, locale, volatilityAware);
      setView(next);
      if (intervalId) window.clearInterval(intervalId);
      intervalId = 0;
      if (next) {
        intervalId = window.setInterval(tick, next.tickMs);
      }
    };

    tick();
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [event, locale, volatilityAware, serverTimeIso]);

  return view;
}

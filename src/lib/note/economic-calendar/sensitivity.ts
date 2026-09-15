import type { EconomicEvent } from "@/lib/note/economic-calendar/types";

export type AssetSensitivity = "usd" | "xau" | "btc";

const XAU_RE =
  /\b(gold|xau|precious|cpi|core cpi|pce|nfp|non[- ]farm|fomc|fed|interest rate|inflation|ppi)\b/i;
const BTC_RE = /\b(bitcoin|btc|crypto|etf.*bit|digital asset)\b/i;

export const ASSET_SENSITIVITY_LABELS: Record<
  AssetSensitivity,
  { id: string; en: string; desc: { id: string; en: string } }
> = {
  usd: {
    id: "USD",
    en: "USD",
    desc: {
      id: "Makro USD langsung",
      en: "Direct USD macro",
    },
  },
  xau: {
    id: "XAU",
    en: "XAU",
    desc: {
      id: "Event yang biasa goyang emas",
      en: "Events that usually move gold",
    },
  },
  btc: {
    id: "BTC",
    en: "BTC",
    desc: {
      id: "USD + headline kripto (FF terbatas)",
      en: "USD + crypto headlines (sparse on FF)",
    },
  },
};

export function filterEventsBySensitivity(
  events: EconomicEvent[],
  sensitivity: AssetSensitivity | null
): EconomicEvent[] {
  if (!sensitivity) return events;

  if (sensitivity === "usd") {
    return events.filter((e) => {
      const c = e.currency.toUpperCase();
      return c === "USD" || c === "ALL";
    });
  }

  if (sensitivity === "xau") {
    return events.filter((e) => {
      const c = e.currency.toUpperCase();
      if (c !== "USD" && c !== "CHF" && c !== "EUR" && c !== "ALL") return false;
      return XAU_RE.test(e.title) || e.impact === "high";
    });
  }

  return events.filter((e) => {
    const c = e.currency.toUpperCase();
    if (BTC_RE.test(e.title)) return true;
    return c === "USD" && e.impact === "high";
  });
}

import { NOTE_TZ } from "@/lib/note/stats";

export type TradingSession = "asia" | "london" | "new_york" | "off";

export function tradingSessionFromIso(iso: string): TradingSession {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: NOTE_TZ,
    }).format(new Date(iso))
  );
  if (hour >= 7 && hour < 14) return "asia";
  if (hour >= 14 && hour < 21) return "london";
  if (hour >= 21 || hour < 3) return "new_york";
  return "off";
}

export function sessionLabel(session: TradingSession, locale: "id" | "en"): string {
  const map: Record<TradingSession, Record<"id" | "en", string>> = {
    asia: { id: "Asia (WIB)", en: "Asia (WIB)" },
    london: { id: "London overlap", en: "London overlap" },
    new_york: { id: "New York", en: "New York" },
    off: { id: "Off-session", en: "Off-session" },
  };
  return map[session][locale];
}

export function assetBucket(symbol: string): string {
  const s = symbol.trim().toUpperCase();
  if (!s) return "OTHER";
  if (/XAU|GOLD|XAG|SILVER/.test(s)) return "XAU";
  if (/BTC|ETH|CRYPTO/.test(s)) return "BTC";
  if (/NQ|NAS|US100|USTEC/.test(s)) return "NQ";
  if (/ES|SPX|US500/.test(s)) return "ES";
  if (/EUR|GBP|USD|JPY|AUD|NZD|CAD|CHF/.test(s) && s.length <= 6) return "FX";
  return s.length > 10 ? s.slice(0, 10) : s;
}

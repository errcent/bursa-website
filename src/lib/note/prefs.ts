import type { JournalKind } from "@/lib/note/types";
import type { FormatPnlOpts } from "@/lib/note/stats";

export const NOTE_PREFS_KEY = "bursa-note-prefs-v1";

export type NumberFormat = "full" | "compact";
export type HeroRange = "all" | "month";
export type WeekStart = "sunday" | "monday";
export type LossStyle = "minus" | "paren";
export type ColorMode = "hue" | "pattern";
export type Density = "comfortable" | "compact";
export type EmotionPrompt = "optional" | "after-loss";
export type NoteLocale = "id" | "en";
export type DisplayCurrency = "IDR" | "USD" | "USDT";
export type NoteTheme = "system" | "dark" | "light";

/**
 * Local journal prefs. Future AI may read `{ entries, prefs, log-vs-pnl timestamps }`
 * to suggest defaults — this pass stores the contract only, no model UI.
 * No logging streak: daily-trade pressure is a harmful default.
 */
export type NotePrefs = {
  version: 1;
  numberFormat: NumberFormat;
  heroRange: HeroRange;
  defaultKind: JournalKind;
  calendarShowNet: boolean;
  weekStart: WeekStart;
  decimals: 0 | 1 | 2;
  lossStyle: LossStyle;
  colorMode: ColorMode;
  density: Density;
  emotionPrompt: EmotionPrompt;
  locale: NoteLocale;
  currency: DisplayCurrency;
  theme: NoteTheme;
};

export const DEFAULT_NOTE_PREFS: NotePrefs = {
  version: 1,
  numberFormat: "compact",
  heroRange: "all",
  defaultKind: "TRADE",
  calendarShowNet: true,
  weekStart: "sunday",
  decimals: 0,
  lossStyle: "minus",
  colorMode: "hue",
  density: "comfortable",
  emotionPrompt: "optional",
  locale: "id",
  currency: "IDR",
  theme: "dark",
};

const listeners = new Set<() => void>();

export function subscribeNotePrefs(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function isKind(value: unknown): value is JournalKind {
  return value === "TRADE" || value === "INVEST";
}

export function parseNotePrefs(raw: unknown): NotePrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_NOTE_PREFS };
  const o = raw as Record<string, unknown>;
  return {
    version: 1,
    numberFormat: o.numberFormat === "full" ? "full" : "compact",
    heroRange: o.heroRange === "month" ? "month" : "all",
    defaultKind: isKind(o.defaultKind) ? o.defaultKind : DEFAULT_NOTE_PREFS.defaultKind,
    calendarShowNet: o.calendarShowNet !== false,
    weekStart: o.weekStart === "monday" ? "monday" : "sunday",
    decimals: o.decimals === 1 || o.decimals === 2 ? o.decimals : 0,
    lossStyle: o.lossStyle === "paren" ? "paren" : "minus",
    colorMode: o.colorMode === "pattern" ? "pattern" : "hue",
    density: o.density === "compact" ? "compact" : "comfortable",
    emotionPrompt: o.emotionPrompt === "after-loss" ? "after-loss" : "optional",
    locale: o.locale === "en" ? "en" : "id",
    currency: o.currency === "USD" || o.currency === "USDT" ? o.currency : "IDR",
    theme: o.theme === "light" || o.theme === "system" ? o.theme : "dark",
  };
}

export function loadNotePrefs(): NotePrefs {
  if (typeof window === "undefined") return { ...DEFAULT_NOTE_PREFS };
  try {
    const raw = window.localStorage.getItem(NOTE_PREFS_KEY);
    if (!raw) return { ...DEFAULT_NOTE_PREFS };
    return parseNotePrefs(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_NOTE_PREFS };
  }
}

export function saveNotePrefs(prefs: NotePrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTE_PREFS_KEY, JSON.stringify({ ...prefs, version: 1 }));
  listeners.forEach((listener) => listener());
}

export function pnlOptsFromPrefs(prefs: NotePrefs): FormatPnlOpts {
  return {
    compact: prefs.numberFormat === "compact",
    decimals: prefs.decimals,
    lossStyle: prefs.lossStyle,
    currency: prefs.currency,
  };
}

export function resolveNoteTheme(theme: NoteTheme, prefersDark = true): "dark" | "light" {
  if (theme === "system") return prefersDark ? "dark" : "light";
  return theme;
}

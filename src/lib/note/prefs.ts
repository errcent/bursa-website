import type { JournalKind } from "@/lib/note/types";
import { pnlFormatForSlot, type FormatPnlOpts, type PnlDisplaySlot } from "@/lib/note/stats";
import { DEFAULT_USD_IDR, normalizeUsdIdrRate } from "@/lib/note/fx/rates";

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

export type NotePrimaryMarket = "fx" | "saham" | "komoditi" | "mixed";
export type NoteExperience = "baru" | "menengah" | "rutin";
export type NoteJournalFocus = "disiplin" | "edge" | "semua";

export type NotePersonalization = {
  primaryMarket?: NotePrimaryMarket;
  experience?: NoteExperience;
  journalFocus?: NoteJournalFocus;
};

/**
 * Local journal prefs. Future AI may read `{ entries, prefs, log-vs-pnl timestamps }`
 * to suggest defaults - this pass stores the contract only, no model UI.
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
  /** Spot IDR per 1 USD for cross-currency aggregates. */
  usdIdrRate: number;
  /** When true, do not overwrite usdIdrRate from market sync. */
  usdIdrRateManual?: boolean;
  /** ISO time when usdIdrRate was last set from market API. */
  usdIdrRateFetchedAt?: string;
  theme: NoteTheme;
  onboardingCompleted: boolean;
  personalization: NotePersonalization;
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
  usdIdrRate: DEFAULT_USD_IDR,
  theme: "dark",
  onboardingCompleted: false,
  personalization: {},
};

const listeners = new Set<() => void>();

export function subscribeNotePrefs(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function isKind(value: unknown): value is JournalKind {
  return value === "TRADE" || value === "INVEST" || value === "REFLEKSI";
}

function parsePersonalization(raw: unknown): NotePersonalization {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const primaryMarket =
    o.primaryMarket === "fx" ||
    o.primaryMarket === "saham" ||
    o.primaryMarket === "komoditi" ||
    o.primaryMarket === "mixed"
      ? o.primaryMarket
      : undefined;
  const experience =
    o.experience === "baru" || o.experience === "menengah" || o.experience === "rutin"
      ? o.experience
      : undefined;
  const journalFocusRaw = o.journalFocus === "emosi" ? "semua" : o.journalFocus;
  const journalFocus =
    journalFocusRaw === "disiplin" ||
    journalFocusRaw === "edge" ||
    journalFocusRaw === "semua"
      ? journalFocusRaw
      : undefined;
  return { primaryMarket, experience, journalFocus };
}

export function parseNotePrefs(raw: unknown): NotePrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_NOTE_PREFS };
  const o = raw as Record<string, unknown>;
  return {
    version: 1,
    numberFormat: o.numberFormat === "full" ? "full" : "compact",
    heroRange: o.heroRange === "month" ? "month" : "all",
    defaultKind:
      o.defaultKind === "INVEST"
        ? "TRADE"
        : isKind(o.defaultKind)
          ? o.defaultKind
          : DEFAULT_NOTE_PREFS.defaultKind,
    calendarShowNet: o.calendarShowNet !== false,
    weekStart: o.weekStart === "monday" ? "monday" : "sunday",
    decimals: o.decimals === 1 || o.decimals === 2 ? o.decimals : 0,
    lossStyle: o.lossStyle === "paren" ? "paren" : "minus",
    colorMode: o.colorMode === "pattern" ? "pattern" : "hue",
    density: o.density === "compact" ? "compact" : "comfortable",
    emotionPrompt: o.emotionPrompt === "after-loss" ? "after-loss" : "optional",
    locale: o.locale === "en" ? "en" : "id",
    currency: o.currency === "USD" || o.currency === "USDT" ? o.currency : "IDR",
    usdIdrRate: normalizeUsdIdrRate(o.usdIdrRate),
    usdIdrRateManual: o.usdIdrRateManual === true,
    usdIdrRateFetchedAt:
      typeof o.usdIdrRateFetchedAt === "string" ? o.usdIdrRateFetchedAt : undefined,
    theme: o.theme === "light" || o.theme === "system" ? o.theme : "dark",
    onboardingCompleted: typeof o.onboardingCompleted === "boolean" ? o.onboardingCompleted : true,
    personalization: parsePersonalization(o.personalization),
  };
}

/** First journal visit (no saved prefs blob). */
export function needsNoteJournalOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(NOTE_PREFS_KEY);
    if (!raw) return true;
    return !parseNotePrefs(JSON.parse(raw) as unknown).onboardingCompleted;
  } catch {
    return true;
  }
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
    locale: prefs.locale,
  };
}

export function pnlOptsForSlot(prefs: NotePrefs, slot: PnlDisplaySlot): FormatPnlOpts {
  return pnlFormatForSlot(pnlOptsFromPrefs(prefs), slot);
}

export function resolveNoteTheme(theme: NoteTheme, prefersDark = true): "dark" | "light" {
  if (theme === "light") return "light";
  if (theme === "system") return prefersDark ? "dark" : "light";
  return "dark";
}

import type { NoteLocale } from "@/lib/note/prefs";

/** One section = one decision function. No overlap across nav. */
export type NoteSectionId =
  | "overview"
  | "journal"
  | "analytics"
  | "news"
  | "notes";

export type NoteSection = {
  id: NoteSectionId;
  href: string;
  label: Record<NoteLocale, string>;
  /** Primary decision question (H1 subline). */
  question: Record<NoteLocale, string>;
  /** System role (tooltip / a11y). */
  role: Record<NoteLocale, string>;
  /** What belongs in this surface only. */
  scope: Record<NoteLocale, string>;
  /** Explicit boundary to reduce ambiguity. */
  boundary: Record<NoteLocale, string>;
};

export const NOTE_SECTIONS: NoteSection[] = [
  {
    id: "overview",
    href: "/note",
    label: { id: "Overview", en: "Overview" },
    question: { id: "Di mana posisiku sekarang?", en: "Where am I right now?" },
    role: { id: "Monitor kondisi (real-time)", en: "State monitor (real-time)" },
    scope: {
      id: "Kurva ekuitas, PnL harian, ringkasan rentang chart.",
      en: "Equity curve, daily PnL, chart-range summary.",
    },
    boundary: {
      id: "Bukan log trade, bukan analisis edge, bukan catatan bebas.",
      en: "Not trade log, not edge stats, not freeform notes.",
    },
  },
  {
    id: "journal",
    href: "/note/jurnal",
    label: { id: "Journal", en: "Journal" },
    question: { id: "Apa yang benar-benar kulakukan?", en: "What did I do?" },
    role: { id: "Ground truth eksekusi", en: "Ground truth execution log" },
    scope: {
      id: "Trade saja: entry/exit, hasil, timestamp, tag setup (simbol/sisi).",
      en: "Trades only: entry/exit, result, timestamp, setup tag (symbol/side).",
    },
    boundary: {
      id: "Tanpa ide, tanpa refleksi panjang, tanpa narasi → Notes.",
      en: "No ideas, no long reflection, no narrative → Notes.",
    },
  },
  {
    id: "analytics",
    href: "/note/analytics",
    label: { id: "Analytics", en: "Analytics" },
    question: { id: "Apa yang harus kubah?", en: "What should I change?" },
    role: { id: "Mesin koreksi keputusan", en: "Decision correction engine" },
    scope: {
      id: "Win rate + satu feed Insight (pola kuat, kebocoran, konteks, drift).",
      en: "Win rate + one Insights feed (strengths, leaks, context, drift).",
    },
    boundary: {
      id: "Bukan dashboard dopamine - hanya pola dari Journal, bukan kalender makro.",
      en: "Not a dopamine dashboard - journal patterns only, not macro calendar.",
    },
  },
  {
    id: "news",
    href: "/note/news",
    label: { id: "News", en: "News" },
    question: { id: "Shock eksternal apa yang mendekat?", en: "What external shocks are coming?" },
    role: { id: "Mesin risiko eksternal", en: "External risk engine" },
    scope: {
      id: "Kalender ekonomi, countdown (CPI/NFP/FOMC), impact, peringatan volatilitas.",
      en: "Economic calendar, countdown (CPI/NFP/FOMC), impact, volatility warning.",
    },
    boundary: {
      id: "Constraint eksternal - tidak dicampur dengan analytics jurnal.",
      en: "External constraints only - never mixed with journal analytics.",
    },
  },
  {
    id: "notes",
    href: "/note/catatan",
    label: { id: "Notes", en: "Notes" },
    question: { id: "Apa yang kueksplorasi sebelum eksekusi?", en: "What am I exploring pre-execution?" },
    role: { id: "Ruang eksplorasi belief (zero execution cost)", en: "Belief exploration space (zero execution cost)" },
    scope: {
      id: "Capture cepat, auto-tag, link opsional ke Journal - sinyal upstream.",
      en: "Quick capture, auto-tags, optional Journal links - upstream signals.",
    },
    boundary: {
      id: "Bukan diary wajib format - mirror & pola ada di Analytics.",
      en: "Not a formatted diary - mirrors and patterns live in Analytics.",
    },
  },
];

export type NoteNavItem = {
  id: NoteSectionId;
  href: string;
  label: Record<NoteLocale, string>;
  hint: Record<NoteLocale, string>;
};

/** Sidebar order = decision loop + external shock isolated. */
export const NOTE_NAV: NoteNavItem[] = NOTE_SECTIONS.map((s) => ({
  id: s.id,
  href: s.href,
  label: s.label,
  hint: s.question,
}));

export function noteSection(id: NoteSectionId): NoteSection {
  const row = NOTE_SECTIONS.find((s) => s.id === id);
  if (!row) throw new Error(`Unknown note section: ${id}`);
  return row;
}

export function noteNavActive(pathname: string, href: string): boolean {
  if (href === "/note") {
    return pathname === "/" || pathname === "/note" || pathname === "/note/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Execution journal in Note is trading-only; invest lives under Track. */
export const NOTE_EXECUTION_KIND = "TRADE" as const;

export type NoteTrackNavItem = {
  id: "track";
  href: string;
  label: Record<NoteLocale, string>;
  hint: Record<NoteLocale, string>;
};

export const NOTE_TRACK_NAV: NoteTrackNavItem[] = [
  {
    id: "track",
    href: "/note/track",
    label: { id: "Track", en: "Track" },
    hint: {
      id: "Holdings, alokasi, transaksi buy/sell/transfer.",
      en: "Holdings, allocation, buy/sell/transfer ledger.",
    },
  },
];

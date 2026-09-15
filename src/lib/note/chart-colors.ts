/**
 * Bursa Note semantic palette. SSOT for JS; mirror in note-theme.css `--chart-*`.
 */
export const NOTE_CHART_COLORS = {
  up: "#34d399",
  upStrong: "#10b981",
  upSoft: "#6ee7b7",
  down: "#fb7185",
  downStrong: "#f43f5e",
  downSoft: "#fda4af",
  warn: "#fbbf24",
  warnStrong: "#f59e0b",
  warnSoft: "#fde68a",
  warnMuted: "#fcd34d",
  /** Info / rail - pairs with sky accents elsewhere in Note */
  info: "#38bdf8",
  infoStrong: "#0ea5e9",
  infoSoft: "#7dd3fc",
  infoTrack: "rgba(14, 165, 233, 0.12)",
  /** Neutral bar rail (not outcome-colored) */
  track: "rgba(255, 255, 255, 0.06)",
} as const;

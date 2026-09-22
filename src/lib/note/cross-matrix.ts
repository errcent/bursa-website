/**
 * Cross-matrix analytics (clean-room).
 *
 * Two-way breakdown of closed trades across Bursa dimensions, sorted by
 * net P&L descending. Dimensions are ID-first: WIB session buckets come
 * from entry time, thesis presence from the structured thesis field.
 */

import { deriveSession } from "@/lib/note/edge-finder";
import { dayKey } from "@/lib/note/stats";
import { isPnlKind, type JournalEntry } from "@/lib/note/types";
import type { NoteLocale } from "@/lib/note/prefs";

export type MatrixDim = "symbol" | "session" | "weekday" | "emotion" | "thesis";

export const MATRIX_DIMS: { id: MatrixDim; label: Record<NoteLocale, string> }[] = [
  { id: "symbol", label: { id: "Simbol", en: "Symbol" } },
  { id: "session", label: { id: "Sesi", en: "Session" } },
  { id: "weekday", label: { id: "Hari", en: "Weekday" } },
  { id: "emotion", label: { id: "Emosi", en: "Emotion" } },
  { id: "thesis", label: { id: "Thesis", en: "Thesis" } },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function dimValue(entry: JournalEntry, dim: MatrixDim): string {
  switch (dim) {
    case "symbol":
      return entry.symbol || "?";
    case "session":
      return entry.session?.trim() || deriveSession(entry.openedAt);
    case "weekday": {
      const idx = new Date(`${dayKey(entry.openedAt)}T12:00:00Z`).getUTCDay();
      return WEEKDAYS[Number.isNaN(idx) ? 0 : idx]!;
    }
    case "emotion":
      return entry.emotion?.trim() || "-";
    case "thesis":
      return entry.thesis?.trim() ? "thesis" : "no-thesis";
  }
}

export interface MatrixCell {
  row: string;
  col: string;
  trades: number;
  net: number;
  wins: number;
  winRate: number | null;
}

export function buildCrossMatrix(
  entries: JournalEntry[],
  rowDim: MatrixDim,
  colDim?: MatrixDim,
): MatrixCell[] {
  const closed = entries.filter((e) => isPnlKind(e.kind) && e.pnl != null && e.result !== "open");
  const cells = new Map<string, MatrixCell>();
  for (const e of closed) {
    const row = dimValue(e, rowDim);
    const col = colDim ? dimValue(e, colDim) : "";
    const key = `${row} ${col}`;
    let cell = cells.get(key);
    if (!cell) {
      cell = { row, col, trades: 0, net: 0, wins: 0, winRate: null };
      cells.set(key, cell);
    }
    cell.trades += 1;
    cell.net += e.pnl ?? 0;
    if ((e.pnl ?? 0) > 0) cell.wins += 1;
  }
  const out = [...cells.values()];
  for (const c of out) c.winRate = c.trades > 0 ? c.wins / c.trades : null;
  out.sort((a, b) => b.net - a.net || a.row.localeCompare(b.row));
  return out;
}

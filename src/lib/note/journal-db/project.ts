import type { CreateEntryInput, JournalEntry, JournalResult } from "@/lib/note/types";
import { buildJournalEntry } from "@/lib/note/build-entry";

import { RESERVED_PROP, type JournalDbRow, type JournalFileRef } from "./types";

function asString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function asNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function inferSide(alasan: string, notes: string): string {
  const blob = `${alasan} ${notes}`.toLowerCase();
  if (/\(short\)|\bshort\b/.test(blob)) return "SELL";
  if (/\(long\)|\blong\b/.test(blob)) return "BUY";
  return "BUY";
}

function mapTpSlToResult(tpSl: string, rr: number | null): JournalResult {
  const t = tpSl.trim().toLowerCase();
  if (!t && rr == null) return "open";
  if (t.includes("sl") && !t.includes("plus") && !t.includes("cancel")) return "loss";
  if (t.includes("cancel") && (rr == null || rr === 0)) return "be";
  if (t.includes("be") || t === "be") return "be";
  if (t.includes("tp") || t.includes("full")) return "win";
  if (t.includes("sl plus") || t.includes("harusnya")) return rr != null && rr > 0 ? "win" : "be";
  if (rr == null) return "open";
  if (rr > 0) return "win";
  if (rr < 0) return "loss";
  return "be";
}

/** Normalize DD/MM/YYYY or ISO-ish to YYYY-MM-DD (+07 openedAt). */
export function parseTanggalToOpenedAt(raw: string, fallbackIso?: string): string {
  const s = raw.trim();
  if (!s) return fallbackIso ?? new Date().toISOString();
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}T12:00:00+07:00`;
  }
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).toISOString();
  return fallbackIso ?? new Date().toISOString();
}

export function projectRowToJournalEntry(
  row: JournalDbRow,
  apexUserId: string
): JournalEntry {
  const v = row.values;
  const pair = asString(v[RESERVED_PROP.pair]).trim() || "UNKNOWN";
  const alasan = asString(v[RESERVED_PROP.alasan]);
  const notes = asString(v[RESERVED_PROP.notes]);
  const rr = asNumber(v[RESERVED_PROP.rr]);
  const tpSl = asString(v[RESERVED_PROP.tpSl]);
  const tanggal = asString(v[RESERVED_PROP.tanggal]);
  const sideRaw = asString(v[RESERVED_PROP.side]).trim();
  const side = sideRaw || inferSide(alasan, notes);
  const openedAt = parseTanggalToOpenedAt(tanggal, row.createdAt);
  const result = mapTpSlToResult(tpSl, rr);

  const input: CreateEntryInput = {
    kind: "TRADE",
    mode: "review",
    symbol: pair.replace(/\.P$/i, ""),
    side,
    pnl: rr,
    result,
    note: [alasan, notes].filter(Boolean).join("\n\n") || null,
    lesson: asString(v[RESERVED_PROP.setup]) || null,
    ruleBroken: tpSl || null,
    emotion: asNumber(v[RESERVED_PROP.fearGreed]) != null ? `FG:${asNumber(v[RESERVED_PROP.fearGreed])}` : null,
    openedAt,
  };

  const built = buildJournalEntry(apexUserId, input);
  return {
    ...built,
    id: row.id,
    createdAt: row.createdAt,
    openedAt,
  };
}

export function projectRowsToJournalEntries(
  rows: JournalDbRow[],
  apexUserId: string
): JournalEntry[] {
  return rows.map((r) => projectRowToJournalEntry(r, apexUserId));
}

export function getRowFiles(row: JournalDbRow, propId = RESERVED_PROP.screenshot): JournalFileRef[] {
  const raw = row.values[propId];
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (f): f is JournalFileRef =>
      Boolean(f) &&
      typeof f === "object" &&
      typeof (f as JournalFileRef).id === "string" &&
      typeof (f as JournalFileRef).name === "string"
  );
}

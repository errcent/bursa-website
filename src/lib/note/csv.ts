import type { CreateEntryInput, JournalKind, JournalResult } from "@/lib/note/types";

const MAX_ROWS = 200;
const MAX_BYTES = 200_000;

const HEADER_ALIASES: Record<string, string> = {
  symbol: "symbol",
  ticker: "symbol",
  pair: "symbol",
  side: "side",
  type: "side",
  qty: "qty",
  volume: "qty",
  lots: "qty",
  size: "qty",
  entry: "entryPrice",
  entryprice: "entryPrice",
  openprice: "entryPrice",
  exit: "exitPrice",
  exitprice: "exitPrice",
  closeprice: "exitPrice",
  fee: "fees",
  fees: "fees",
  commission: "fees",
  pnl: "pnl",
  profit: "pnl",
  result: "result",
  kind: "kind",
  opened: "openedAt",
  time: "openedAt",
  date: "openedAt",
  note: "note",
  comment: "note",
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function normalizeHeader(raw: string): string | null {
  const key = raw.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s_-]/g, "");
  return HEADER_ALIASES[key] ?? null;
}

function toNumber(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value.replace(/%/g, "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function toKind(value: string | undefined): JournalKind {
  return value?.toUpperCase() === "INVEST" ? "INVEST" : "TRADE";
}

function toResult(value: string | undefined, pnl: number | null): JournalResult | null {
  const v = value?.toLowerCase();
  if (v === "win" || v === "loss" || v === "be" || v === "open") return v;
  if (pnl == null) return null;
  if (pnl > 0) return "win";
  if (pnl < 0) return "loss";
  return "be";
}

export function parseJournalCsv(raw: string): { entries: CreateEntryInput[]; errors: string[] } {
  if (raw.length > MAX_BYTES) {
    return { entries: [], errors: ["File CSV terlalu besar (maks 200 KB)."] };
  }

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { entries: [], errors: ["CSV perlu header dan minimal 1 baris data."] };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  if (!headers.includes("symbol")) {
    return { entries: [], errors: ["Header wajib: symbol atau ticker."] };
  }

  const errors: string[] = [];
  const entries: CreateEntryInput[] = [];
  const body = lines.slice(1, MAX_ROWS + 1);
  if (lines.length - 1 > MAX_ROWS) {
    errors.push(`Hanya ${MAX_ROWS} baris pertama yang diimpor.`);
  }

  body.forEach((line, index) => {
    const cols = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      if (h) row[h] = cols[i] ?? "";
    });
    const symbol = row.symbol?.trim();
    if (!symbol) {
      errors.push(`Baris ${index + 2}: simbol kosong, dilewati.`);
      return;
    }
    const pnl = toNumber(row.pnl);
    entries.push({
      kind: toKind(row.kind),
      mode: "cepat",
      symbol,
      side: (row.side || "BUY").toUpperCase(),
      qty: toNumber(row.qty),
      entryPrice: toNumber(row.entryPrice),
      exitPrice: toNumber(row.exitPrice),
      fees: toNumber(row.fees),
      pnl,
      result: toResult(row.result, pnl),
      note: row.note || null,
      openedAt: row.openedAt || null,
    });
  });

  return { entries, errors };
}

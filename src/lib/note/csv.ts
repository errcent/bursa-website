import type { CreateEntryInput, JournalKind, JournalResult } from "@/lib/note/types";
import type { Fill, FillSide } from "@/lib/note/position/types";

const MAX_ROWS = 200;
const MAX_BYTES = 200_000;

const HEADER_ALIASES: Record<string, string> = {
  symbol: "symbol",
  ticker: "symbol",
  pair: "symbol",
  saham: "symbol",
  kode: "symbol",
  stock: "symbol",
  side: "side",
  type: "side",
  arah: "side",
  aksi: "side",
  qty: "qty",
  volume: "qty",
  lots: "qty",
  size: "qty",
  jumlah: "qty",
  lot: "qty",
  entry: "entryPrice",
  entryprice: "entryPrice",
  openprice: "entryPrice",
  harga: "entryPrice",
  hargabeli: "entryPrice",
  beli: "entryPrice",
  exit: "exitPrice",
  exitprice: "exitPrice",
  closeprice: "exitPrice",
  hargaJual: "exitPrice",
  jual: "exitPrice",
  fee: "fees",
  fees: "fees",
  commission: "fees",
  biaya: "fees",
  pnl: "pnl",
  profit: "pnl",
  hasil: "pnl",
  result: "result",
  kind: "kind",
  opened: "openedAt",
  time: "openedAt",
  date: "openedAt",
  tanggal: "openedAt",
  note: "note",
  comment: "note",
  catatan: "note",
  // TraderSync / TradeZella / Edgewonk aliases
  tradeid: "symbol",
  orderid: "symbol",
  positionid: "symbol",
  tradereference: "symbol",
  executionid: "symbol",
  instrument: "symbol",
  asset: "symbol",
  direction: "side",
  positionside: "side",
  buysell: "side",
  contracts: "qty",
  open: "entryPrice",
  close: "exitPrice",
  realizedpnl: "pnl",
  unrealizedpnl: "pnl",
  totalpnl: "pnl",
  netpnl: "pnl",
  tradingession: "openedAt",
  executiontime: "openedAt",
  datetime: "openedAt",
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

/** Common IDX tickers — auto-append .JK if missing. */
const IDX_TICKERS = new Set([
  "BBCA", "BBRI", "BBNI", "BMRI", "BBKP", "BBTN", "BNGA", "BNII",
  "TLKM", "ASII", "GGRM", "UNVR", "ICBP", "MBTO", "ADRO", "ANTM",
  "PGAS", "TPIA", "UNTR", "INDF", "SMGR", "INDS", "JPFA",
  "KLBF", "INCO", "TINS", "INTP", "ISAT", "EXCL", "HMSP",
  "AKRA", "MEDC", "MIKA", "MPPA", "MYRX", "PGAS", "PTBA",
  "PWON", "SMRA", "STAR", "TOWR", "TRAM", "UNVR", "WSBP",
]);

/** Auto-append .JK suffix for likely IDX stock symbols. */
function normalizeIdxSymbol(symbol: string): string {
  const s = symbol.toUpperCase().trim();
  if (s.includes(".") || s.includes(":")) return s; // already has exchange suffix
  if (s.endsWith("=X") || s.endsWith("USDT") || s.endsWith("USD")) return s; // forex/crypto
  if (IDX_TICKERS.has(s)) return `${s}.JK`;
  return s;
}

/** Detect if CSV looks like Stockbit export (Indonesian headers). */
function isStockbitFormat(headers: string[]): boolean {
  const h = headers.map((x) => x.toLowerCase());
  return h.includes("saham") || h.includes("kode") || h.includes("aksi");
}

/** Detect if CSV looks like Ajaib export. */
function isAjaibFormat(headers: string[]): boolean {
  const h = headers.map((x) => x.toLowerCase());
  return h.includes("order id") || h.includes("order_id") || h.includes("no. order");
}

/** Detect if CSV looks like TraderSync export. */
function isTraderSyncFormat(headers: string[]): boolean {
  const h = headers.map((x) => x.toLowerCase().replace(/[\s_-]/g, ""));
  return h.includes("tradeid") || h.includes("orderid") || h.includes("positionid");
}

/** Detect if CSV looks like TradeZella export. */
function isTradeZellaFormat(headers: string[]): boolean {
  const h = headers.map((x) => x.toLowerCase().replace(/[\s_-]/g, ""));
  return h.includes("tradereference") || h.includes("executionid");
}

/** Detect if CSV looks like Edgewonk export. */
function isEdgewonkFormat(headers: string[]): boolean {
  const h = headers.map((x) => x.toLowerCase().replace(/[\s_-]/g, ""));
  return h.includes("tradingsession") || h.includes("setupname");
}

/** Detect broker format from headers. */
function detectBrokerFormat(headers: string[]): string | null {
  if (isStockbitFormat(headers)) return "stockbit";
  if (isAjaibFormat(headers)) return "ajaib";
  if (isTraderSyncFormat(headers)) return "tradersync";
  if (isTradeZellaFormat(headers)) return "tradezella";
  if (isEdgewonkFormat(headers)) return "edgewonk";
  return null;
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
  // Accept symbol/ticker/saham/kode as the required symbol column
  const hasSymbol = headers.some((h) => h === "symbol");
  if (!hasSymbol) {
    return { entries: [], errors: ["Header wajib: symbol, ticker, saham, atau kode."] };
  }

  const isStockbit = isStockbitFormat(parseCsvLine(lines[0]));
  const isAjaib = isAjaibFormat(parseCsvLine(lines[0]));

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
    const symbol = normalizeIdxSymbol(row.symbol?.trim() ?? "");
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

/** Grain of a statement: per-row trades (has pnl) vs raw fills (side+qty+price, no pnl). */
export type CsvGrain = "trades" | "fills" | "unknown";

export function detectCsvGrain(raw: string): CsvGrain {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 1) return "unknown";
  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  if (headers.includes("pnl") || headers.includes("result")) return "trades";
  if (headers.includes("symbol") && headers.includes("side")) return "fills";
  return "unknown";
}

function toFillSide(value: string | undefined): FillSide {
  const v = (value ?? "BUY").trim().toUpperCase();
  return v.startsWith("SELL") || v.startsWith("SHORT") || v === "S" ? "sell" : "buy";
}

/**
 * Parse a fills-grain CSV (broker executions: side/qty/price per row, no per-row pnl).
 * Caller feeds the fills into buildPositionCycles, then cyclesToEntries.
 */
export function parseJournalFills(
  raw: string,
  opts: { accountRef?: string } = {},
): { fills: Fill[]; errors: string[] } {
  if (raw.length > MAX_BYTES) {
    return { fills: [], errors: ["File CSV terlalu besar (maks 200 KB)."] };
  }
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { fills: [], errors: ["CSV perlu header dan minimal 1 baris data."] };
  }
  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const hasSymbol = headers.some((h) => h === "symbol");
  if (!hasSymbol) {
    return { fills: [], errors: ["Header wajib: symbol, ticker, saham, atau kode."] };
  }

  const errors: string[] = [];
  const fills: Fill[] = [];
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
    const symbol = normalizeIdxSymbol(row.symbol?.trim() ?? "");
    const qty = toNumber(row.qty) ?? 0;
    const price = toNumber(row.entryPrice) ?? toNumber(row.exitPrice) ?? NaN;
    if (!symbol || qty <= 0 || !Number.isFinite(price)) {
      errors.push(`Baris ${index + 2}: fill tidak lengkap (butuh simbol/qty/harga), dilewati.`);
      return;
    }
    fills.push({
      id: `${Date.now().toString(36)}-${index.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      accountRef: opts.accountRef ?? "import",
      ticker: symbol,
      side: toFillSide(row.side),
      size: qty,
      price,
      fee: toNumber(row.fees) ?? 0,
      filledAt: row.openedAt || new Date().toISOString(),
      origin: "import",
      sequence: index,
    });
  });

  return { fills, errors };
}

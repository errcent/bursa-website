import type { CreateEntryInput, JournalKind, JournalResult } from "@/lib/note/types";
import type { Fill, FillSide } from "@/lib/note/position/types";
import { extractTables, looksLikeMtStatement, pickDealTable, tableRecords } from "@/lib/note/statements/html";
import { sectionRecords, sliceHeadedBlock, sliceSections } from "@/lib/note/statements/sections";
import { interpretInTz } from "@/lib/note/statements/timezone";

const MAX_ROWS = 5000;
const MAX_BYTES = 2_000_000;
const ROW_WINDOW = 1000;

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
  price: "entryPrice",
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

export interface CsvParseOpts {
  accountRef?: string;
  /** IANA zone for naive statement timestamps. */
  statementTz?: string;
  /** Fee applied when a row carries none. */
  defaultFee?: number;
}

function resolveStampedAt(raw: string | undefined, statementTz: string | undefined, fallback: string | null): string | null {
  if (!raw) return fallback;
  if (!statementTz) return raw;
  return interpretInTz(raw, statementTz) ?? raw;
}

export function parseJournalCsv(raw: string, opts: CsvParseOpts = {}): { entries: CreateEntryInput[]; errors: string[] } {
  if (raw.length > MAX_BYTES) {
    return { entries: [], errors: ["File CSV terlalu besar (maks 2 MB)."] };
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
      fees: toNumber(row.fees) ?? (opts.defaultFee || null),
      pnl,
      result: toResult(row.result, pnl),
      note: row.note || null,
      openedAt: resolveStampedAt(row.openedAt, opts.statementTz, null),
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
  opts: CsvParseOpts = {},
): { fills: Fill[]; errors: string[] } {
  if (raw.length > MAX_BYTES) {
    return { fills: [], errors: ["File CSV terlalu besar (maks 2 MB)."] };
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
      fee: toNumber(row.fees) ?? opts.defaultFee ?? 0,
      filledAt: resolveStampedAt(row.openedAt, opts.statementTz, new Date().toISOString()) ?? new Date().toISOString(),
      origin: "import",
      sequence: index,
    });
  });

  return { fills, errors };
}

/**
 * Statement format detection. Order is deliberate and ID-first:
 * Stockbit → Ajaib → MT-HTML → IBKR-section → ThinkorSwim-section → generic.
 * Content signatures (HTML, section tags) beat plain header sniffing.
 */
export type StatementFormat =
  | "stockbit"
  | "ajaib"
  | "html-mt"
  | "ibkr-section"
  | "tos-section"
  | "generic";

export function detectStatementFormat(text: string): StatementFormat {
  const firstLines = text.split(/\r?\n/).slice(0, 12).join("\n");
  const firstLine = (text.split(/\r?\n/).find((l) => l.trim()) ?? "").trim();
  if (isStockbitFormat(parseCsvLine(firstLine))) return "stockbit";
  if (isAjaibFormat(parseCsvLine(firstLine))) return "ajaib";
  if (looksLikeMtStatement(text)) return "html-mt";
  if (/^Trades,Header,/im.test(firstLines)) return "ibkr-section";
  if (/Account Trade History/i.test(firstLines)) return "tos-section";
  return "generic";
}

function recordToFill(
  row: Record<string, string>,
  index: number,
  accountRef: string,
  opts: CsvParseOpts = {},
): Fill | null {
  const symbol = normalizeIdxSymbol((row.symbol ?? "").trim());
  const sideRaw = (row.side ?? "").trim().toUpperCase();
  const side: FillSide = sideRaw.startsWith("SELL") || sideRaw.startsWith("SHORT") || sideRaw === "S" ? "sell" : "buy";
  const size = toNumber(row.qty) ?? 0;
  const price = toNumber(row.entryPrice) ?? toNumber(row.exitPrice) ?? NaN;
  if (!symbol || size <= 0 || !Number.isFinite(price)) return null;
  return {
    id: `stmt-${Date.now().toString(36)}-${index.toString(36)}`,
    accountRef,
    ticker: symbol,
    side,
    size,
    price,
    fee: toNumber(row.fees) ?? opts.defaultFee ?? 0,
    filledAt: resolveStampedAt(row.openedAt, opts.statementTz, new Date().toISOString()) ?? new Date().toISOString(),
    origin: "import",
    sequence: index,
  };
}

/** Parse IBKR activity (`Trades` section) or ThinkorSwim block into fills. */
export function parseSectionFills(
  text: string,
  format: "ibkr-section" | "tos-section",
  opts: CsvParseOpts = {},
): { fills: Fill[]; errors: string[] } {
  const accountRef = opts.accountRef ?? "import";
  const errors: string[] = [];
  const fills: Fill[] = [];
  try {
    const records =
      format === "ibkr-section"
        ? (() => {
            const section = sliceSections(text).find((s) => s.tag.toLowerCase() === "trades");
            return section ? sectionRecords(section, normalizeHeader) : [];
          })()
        : (() => {
            const section = sliceHeadedBlock(text, "Account Trade History");
            return section ? sectionRecords(section, normalizeHeader) : [];
          })();
    if (records.length === 0) {
      return { fills, errors: ["Blok section tidak memuat baris data."] };
    }
    records.slice(0, MAX_ROWS).forEach((row, index) => {
      const fill = recordToFill(row, index, accountRef, opts);
      if (fill) fills.push(fill);
    });
    if (fills.length === 0) errors.push("Tidak ada fill valid pada section ini.");
  } catch {
    errors.push("Gagal membaca section statement.");
  }
  return { fills, errors };
}

/** Parse an MT HTML deal report into fills via table extraction. */
export function parseHtmlFills(
  html: string,
  opts: CsvParseOpts = {},
): { fills: Fill[]; errors: string[] } {
  const accountRef = opts.accountRef ?? "import";
  const tables = extractTables(html);
  const dealTable = pickDealTable(tables, normalizeHeader, ["symbol", "side", "qty"]);
  if (!dealTable) {
    return { fills: [], errors: ["Tidak ada tabel deal yang dikenali pada HTML ini."] };
  }
  const fills: Fill[] = [];
  for (const [index, row] of tableRecords(dealTable, normalizeHeader).slice(0, MAX_ROWS).entries()) {
    const fill = recordToFill(row, index, accountRef, opts);
    if (fill) fills.push(fill);
  }
  if (fills.length === 0) {
    return { fills, errors: ["Tabel deal tidak memuat fill valid."] };
  }
  return { fills, errors: [] };
}

/** Process row windows (bounds peak memory on large statements). */
export function windows<T>(rows: T[], size: number = ROW_WINDOW): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

import {
  assetBucket,
  sessionLabel,
  tradingSessionFromIso,
  type TradingSession,
} from "@/lib/note/analytics/session";
import { dayKey, resolvedResult, sundayIndex } from "@/lib/note/stats";
import { isPnlKind, type JournalEntry } from "@/lib/note/types";

export type SurfaceAxisId = "session" | "weekday" | "hour_wib" | "side";
export type SurfaceRowId = "symbol" | "asset" | "side" | "session";
export type SurfaceMetricId = "win_rate" | "net_pnl" | "avg_pnl" | "count";

export type SurfaceGridOptions = {
  entries: JournalEntry[];
  xAxis: SurfaceAxisId;
  yAxis: SurfaceRowId;
  metric: SurfaceMetricId;
  from?: string;
  to?: string;
  includeBe: boolean;
  topRows?: number;
  minCellCount?: number;
  locale: "id" | "en";
};

export type SurfaceGrid = {
  xKeys: string[];
  yKeys: string[];
  xLabels: string[];
  yLabels: string[];
  z: (number | null)[][];
  counts: number[][];
  xTitle: string;
  yTitle: string;
  zTitle: string;
  zMin: number;
  zMax: number;
  filteredCount: number;
  empty: boolean;
};

const SESSION_ORDER: TradingSession[] = ["asia", "london", "new_york", "off"];

const HOUR_BLOCKS = [
  { key: "h0", test: (h: number) => h < 6 },
  { key: "h1", test: (h: number) => h >= 6 && h < 12 },
  { key: "h2", test: (h: number) => h >= 12 && h < 18 },
  { key: "h3", test: (h: number) => h >= 18 },
] as const;

type DimId = SurfaceAxisId | SurfaceRowId;

function wibHour(iso: string): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(new Date(iso))
  );
}

function closedForSurface(entry: JournalEntry, includeBe: boolean): boolean {
  if (!isPnlKind(entry.kind) || entry.pnl == null) return false;
  const r = resolvedResult(entry);
  if (r === "open") return false;
  if (!includeBe && r === "be") return false;
  return r === "win" || r === "loss" || r === "be";
}

function inRange(openedAt: string, from?: string, to?: string): boolean {
  const dk = dayKey(openedAt);
  if (from && dk < from) return false;
  if (to && dk > to) return false;
  return true;
}

export function axisStableKey(entry: JournalEntry, dim: DimId): string {
  switch (dim) {
    case "session":
      return tradingSessionFromIso(entry.openedAt);
    case "weekday":
      return String(sundayIndex(dayKey(entry.openedAt)));
    case "hour_wib": {
      const h = wibHour(entry.openedAt);
      return HOUR_BLOCKS.find((b) => b.test(h))?.key ?? "h?";
    }
    case "side":
      return entry.side?.trim().toUpperCase() || "BUY";
    case "symbol":
      return entry.symbol.trim() || "-";
    case "asset":
      return assetBucket(entry.symbol);
    default:
      return "?";
  }
}

export function axisDisplayLabel(key: string, dim: DimId, locale: "id" | "en"): string {
  switch (dim) {
    case "session":
      return sessionLabel(key as TradingSession, locale);
    case "weekday": {
      const labels =
        locale === "en"
          ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
          : ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      return labels[Number(key)] ?? key;
    }
    case "hour_wib": {
      const map: Record<string, Record<"id" | "en", string>> = {
        h0: { id: "00–05 WIB", en: "00–05 WIB" },
        h1: { id: "06–11 WIB", en: "06–11 WIB" },
        h2: { id: "12–17 WIB", en: "12–17 WIB" },
        h3: { id: "18–23 WIB", en: "18–23 WIB" },
      };
      return map[key]?.[locale] ?? key;
    }
    default:
      return key;
  }
}

function orderedXKeys(axis: SurfaceAxisId): string[] | null {
  switch (axis) {
    case "session":
      return [...SESSION_ORDER];
    case "weekday":
      return ["0", "1", "2", "3", "4", "5", "6"];
    case "hour_wib":
      return HOUR_BLOCKS.map((b) => b.key);
    case "side":
      return ["BUY", "SELL"];
    default:
      return null;
  }
}

function topRowKeys(rows: JournalEntry[], yAxis: SurfaceRowId, top: number): string[] {
  const counts = new Map<string, number>();
  for (const e of rows) {
    const k = axisStableKey(e, yAxis);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, top)
    .map(([k]) => k);
}

function axisTitle(id: DimId, locale: "id" | "en"): string {
  const map: Record<string, Record<"id" | "en", string>> = {
    session: { id: "Sesi (WIB)", en: "Session (WIB)" },
    weekday: { id: "Hari", en: "Weekday" },
    hour_wib: { id: "Blok jam WIB", en: "Hour block (WIB)" },
    side: { id: "Sisi", en: "Side" },
    symbol: { id: "Simbol", en: "Symbol" },
    asset: { id: "Kelas aset", en: "Asset class" },
  };
  return map[id]?.[locale] ?? id;
}

function metricTitle(metric: SurfaceMetricId, locale: "id" | "en"): string {
  const map: Record<SurfaceMetricId, Record<"id" | "en", string>> = {
    win_rate: { id: "Win rate (%)", en: "Win rate (%)" },
    net_pnl: { id: "Net PnL", en: "Net PnL" },
    avg_pnl: { id: "PnL rata-rata", en: "Avg PnL" },
    count: { id: "Jumlah close", en: "Close count" },
  };
  return map[metric][locale];
}

type CellAgg = { wins: number; closed: number; net: number };

function computeMetric(agg: CellAgg, metric: SurfaceMetricId): number {
  switch (metric) {
    case "win_rate":
      return agg.closed ? (agg.wins / agg.closed) * 100 : 0;
    case "net_pnl":
      return agg.net;
    case "avg_pnl":
      return agg.closed ? agg.net / agg.closed : 0;
    case "count":
      return agg.closed;
  }
}

export function buildAnalyticsSurfaceGrid(opts: SurfaceGridOptions): SurfaceGrid {
  const topRows = opts.topRows ?? 8;
  const minCell = opts.minCellCount ?? 1;

  const filtered = opts.entries.filter(
    (e) => closedForSurface(e, opts.includeBe) && inRange(e.openedAt, opts.from, opts.to)
  );

  const xFixed = orderedXKeys(opts.xAxis);
  const xKeys =
    xFixed ??
    [...new Set(filtered.map((e) => axisStableKey(e, opts.xAxis)))].sort((a, b) => a.localeCompare(b));

  const yKeys = topRowKeys(filtered, opts.yAxis, topRows);

  const cellMap = new Map<string, CellAgg>();
  const yKeySet = new Set(yKeys);
  for (const e of filtered) {
    const yk = axisStableKey(e, opts.yAxis);
    if (!yKeySet.has(yk)) continue;
    const xk = axisStableKey(e, opts.xAxis);
    const key = `${yk}\0${xk}`;
    const agg = cellMap.get(key) ?? { wins: 0, closed: 0, net: 0 };
    agg.closed += 1;
    agg.net += e.pnl ?? 0;
    if ((e.pnl ?? 0) > 0) agg.wins += 1;
    cellMap.set(key, agg);
  }

  const z: (number | null)[][] = [];
  const counts: number[][] = [];
  let zMin = Number.POSITIVE_INFINITY;
  let zMax = Number.NEGATIVE_INFINITY;

  for (const yk of yKeys) {
    const zRow: (number | null)[] = [];
    const cRow: number[] = [];
    for (const xk of xKeys) {
      const agg = cellMap.get(`${yk}\0${xk}`) ?? { wins: 0, closed: 0, net: 0 };
      cRow.push(agg.closed);
      if (agg.closed < minCell) {
        zRow.push(null);
      } else {
        const v = computeMetric(agg, opts.metric);
        zRow.push(Math.round(v * 100) / 100);
        zMin = Math.min(zMin, v);
        zMax = Math.max(zMax, v);
      }
    }
    z.push(zRow);
    counts.push(cRow);
  }

  if (!Number.isFinite(zMin)) {
    zMin = 0;
    zMax = opts.metric === "win_rate" ? 100 : 1;
  }

  return {
    xKeys,
    yKeys,
    xLabels: xKeys.map((k) => axisDisplayLabel(k, opts.xAxis, opts.locale)),
    yLabels: yKeys.map((k) => axisDisplayLabel(k, opts.yAxis, opts.locale)),
    z,
    counts,
    xTitle: axisTitle(opts.xAxis, opts.locale),
    yTitle: axisTitle(opts.yAxis, opts.locale),
    zTitle: metricTitle(opts.metric, opts.locale),
    zMin,
    zMax,
    filteredCount: filtered.length,
    empty: filtered.length === 0 || yKeys.length === 0 || xKeys.length === 0,
  };
}

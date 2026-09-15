import type {
  AnalyticsReport,
  ContextCell,
  ContextZone,
  EdgeRow,
  LeakagePattern,
  PlaybookSuggestion,
} from "@/lib/note/analytics/types";
import {
  assetBucket,
  sessionLabel,
  tradingSessionFromIso,
  type TradingSession,
} from "@/lib/note/analytics/session";
import type { BehaviorRiskWeights } from "@/lib/note/playbook/types";
import { dayKey, groupBySymbol, type SliceStat } from "@/lib/note/stats";
import { isPnlKind, type JournalEntry } from "@/lib/note/types";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const MIN_SAMPLE = 3;

function closedPnlRows(entries: JournalEntry[]): JournalEntry[] {
  return entries.filter(
    (e) => isPnlKind(e.kind) && (e.result === "win" || e.result === "loss" || e.result === "be")
  );
}

function toEdgeRows(stats: SliceStat[], labelFn: (key: string) => string): EdgeRow[] {
  return stats
    .filter((s) => s.closed >= MIN_SAMPLE)
    .map((s) => ({ ...s, label: labelFn(s.key) }))
    .sort((a, b) => b.net - a.net);
}

function groupBySession(entries: JournalEntry[]): SliceStat[] {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const key = tradingSessionFromIso(e.openedAt);
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  return sliceFromMap(map);
}

function groupByAsset(entries: JournalEntry[]): SliceStat[] {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const key = assetBucket(e.symbol);
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  return sliceFromMap(map);
}

function sliceFromMap(map: Map<string, JournalEntry[]>): SliceStat[] {
  return [...map.entries()]
    .map(([key, rows]) => {
      const closed = rows.filter((r) => r.result === "win" || r.result === "loss" || r.result === "be");
      const wins = closed.filter((r) => r.result === "win");
      const losses = closed.filter((r) => r.result === "loss");
      const be = closed.filter((r) => r.result === "be");
      const net = closed.reduce((a, r) => a + (r.pnl ?? 0), 0);
      return {
        key,
        net,
        count: rows.length,
        closed: closed.length,
        wins: wins.length,
        losses: losses.length,
        be: be.length,
        winRate: closed.length ? wins.length / closed.length : null,
      };
    })
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || b.count - a.count);
}

function zoneFromStat(net: number, winRate: number | null, count: number): ContextZone {
  if (count < MIN_SAMPLE) return "neutral";
  if (net > 0 && (winRate ?? 0) >= 0.45) return "high";
  if (net < 0 && (winRate ?? 1) <= 0.4) return "avoid";
  return "neutral";
}

function detectLeakage(entries: JournalEntry[], locale: "id" | "en"): LeakagePattern[] {
  const out: LeakagePattern[] = [];
  const sorted = [...entries.filter((e) => isPnlKind(e.kind))].sort(
    (a, b) => Date.parse(a.openedAt) - Date.parse(b.openedAt)
  );

  let revengeCount = 0;
  let revengeNet = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (prev.result !== "loss") continue;
    const delta = Date.parse(cur.openedAt) - Date.parse(prev.openedAt);
    if (delta >= 0 && delta <= TWO_HOURS_MS) {
      revengeCount += 1;
      revengeNet += cur.pnl ?? 0;
    }
  }
  if (revengeCount >= 2) {
    out.push({
      id: "revenge",
      title: { id: "Zona revenge", en: "Revenge zone" },
      detail: {
        id: `${revengeCount} entry ≤2j setelah loss · net ${revengeNet}`,
        en: `${revengeCount} entries ≤2h after a loss · net ${revengeNet}`,
      },
      severity: revengeNet < 0 ? "high" : "med",
      net: revengeNet,
      count: revengeCount,
    });
  }

  const byDay = new Map<string, JournalEntry[]>();
  for (const e of sorted) {
    const d = dayKey(e.openedAt);
    const list = byDay.get(d) ?? [];
    list.push(e);
    byDay.set(d, list);
  }
  let clusterDays = 0;
  let clusterNet = 0;
  for (const [, rows] of byDay) {
    if (rows.length >= 4) {
      clusterDays += 1;
      clusterNet += rows.reduce((a, r) => a + (r.pnl ?? 0), 0);
    }
  }
  if (clusterDays >= 1) {
    out.push({
      id: "overtrade",
      title: { id: "Cluster overtrade", en: "Overtrade cluster" },
      detail: {
        id: `${clusterDays} hari dengan 4+ entry · net ${clusterNet}`,
        en: `${clusterDays} days with 4+ entries · net ${clusterNet}`,
      },
      severity: clusterNet < 0 ? "high" : "med",
      net: clusterNet,
      count: clusterDays,
    });
  }

  const rules = sorted.filter((e) => e.ruleBroken?.trim());
  if (rules.length >= 2) {
    const net = rules.reduce((a, r) => a + (r.pnl ?? 0), 0);
    out.push({
      id: "rules",
      title: { id: "Pelanggaran aturan", en: "Rule violations" },
      detail: {
        id: `${rules.length} entry dengan rule broken · net ${net}`,
        en: `${rules.length} entries with rule broken · net ${net}`,
      },
      severity: "high",
      net,
      count: rules.length,
    });
  }

  return out.sort((a, b) => (a.severity === "high" ? -1 : 1));
}

function buildContext(entries: JournalEntry[], locale: "id" | "en"): ContextCell[] {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    if (!isPnlKind(e.kind)) continue;
    const sess = tradingSessionFromIso(e.openedAt);
    const hour = Number(
      new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Jakarta" }).format(
        new Date(e.openedAt)
      )
    );
    const volProxy = hour >= 20 || hour <= 2 ? "high_vol" : "normal_vol";
    const key = `${sess}|${volProxy}`;
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }

  const cells: ContextCell[] = [];
  for (const [key, rows] of map) {
    const [sess, vol] = key.split("|");
    const closed = rows.filter((r) => r.result === "win" || r.result === "loss" || r.result === "be");
    const wins = closed.filter((r) => r.result === "win");
    const net = closed.reduce((a, r) => a + (r.pnl ?? 0), 0);
    const winRate = closed.length ? wins.length / closed.length : null;
    cells.push({
      key,
      label: {
        id: `${sessionLabel(sess as TradingSession, "id")} · ${vol === "high_vol" ? "vol tinggi" : "vol normal"}`,
        en: `${sessionLabel(sess as TradingSession, "en")} · ${vol === "high_vol" ? "high vol" : "normal vol"}`,
      },
      zone: zoneFromStat(net, winRate, closed.length),
      net,
      count: closed.length,
      winRate,
    });
  }
  return cells.sort((a, b) => b.net - a.net);
}

function buildDrift(entries: JournalEntry[], locale: "id" | "en") {
  const now = Date.now();
  const recentStart = now - 7 * 86400000;
  const priorStart = now - 14 * 86400000;
  const recent = entries.filter((e) => Date.parse(e.openedAt) >= recentStart);
  const prior = entries.filter(
    (e) => Date.parse(e.openedAt) >= priorStart && Date.parse(e.openedAt) < recentStart
  );

  const rate = (rows: JournalEntry[]) => {
    const closed = rows.filter((r) => r.result === "win" || r.result === "loss");
    const wins = closed.filter((r) => r.result === "win");
    return closed.length ? wins.length / closed.length : null;
  };

  const revengeRate = (rows: JournalEntry[]) => {
    const sorted = [...rows].sort((a, b) => Date.parse(a.openedAt) - Date.parse(b.openedAt));
    let hits = 0;
    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i - 1].result !== "loss") continue;
      const delta = Date.parse(sorted[i].openedAt) - Date.parse(sorted[i - 1].openedAt);
      if (delta >= 0 && delta <= TWO_HOURS_MS) hits += 1;
    }
    return sorted.length ? hits / sorted.length : 0;
  };

  const drift = (label: Record<"id" | "en", string>, recentVal: number | null, priorVal: number | null) => {
    if (recentVal == null || priorVal == null) return null;
    const diff = recentVal - priorVal;
    const direction = Math.abs(diff) < 0.05 ? "flat" : diff > 0 ? "better" : "worse";
    return {
      metric: label,
      recent: `${Math.round(recentVal * 100)}%`,
      prior: `${Math.round(priorVal * 100)}%`,
      direction: direction as "better" | "worse" | "flat",
    };
  };

  const out = [];
  const wr = drift(
    { id: "Win rate (7h)", en: "Win rate (7d)" },
    rate(recent),
    rate(prior)
  );
  if (wr) out.push(wr);

  if (recent.length > 0 || prior.length > 0) {
    const freqRecent = recent.length / 7;
    const freqPrior = prior.length / 7;
    const diff = freqRecent - freqPrior;
    out.push({
      metric: { id: "Frekuensi trade (per hari)", en: "Trade frequency (per day)" },
      recent: freqRecent.toFixed(1),
      prior: freqPrior.toFixed(1),
      direction: Math.abs(diff) < 0.3 ? "flat" : diff > 0 ? "worse" : "better",
    });
  }

  const rev = drift(
    { id: "Revenge rate", en: "Revenge rate" },
    revengeRate(recent),
    revengeRate(prior)
  );
  if (rev) out.push(rev);

  return out;
}

function buildSuggestions(
  leakage: LeakagePattern[],
  weights: BehaviorRiskWeights | null,
  edge: EdgeRow[]
): PlaybookSuggestion[] {
  const s: PlaybookSuggestion[] = [];
  const over = leakage.find((l) => l.id === "overtrade");
  if (over && over.severity === "high") {
    s.push({
      id: "tighten-trades",
      title: { id: "Kencangkan max trade/sesi", en: "Tighten max trades/session" },
      detail: {
        id: "Overtrade cluster terdeteksi di Journal.",
        en: "Overtrade cluster detected in Journal.",
      },
      patch: { rules: { maxTradesPerSession: 2 } },
    });
  }
  const rev = leakage.find((l) => l.id === "revenge");
  if (rev) {
    s.push({
      id: "revenge-profile",
      title: { id: "Aktifkan profil revenge + cooldown", en: "Enable revenge profile + cooldown" },
      detail: {
        id: "Loss cepat diikuti entry baru.",
        en: "Quick re-entry after losses.",
      },
      patch: {
        signal: { lossResponse: "revenge" },
        rules: { cooldownMinutesAfterLoss: 30 },
      },
    });
  }
  if (weights && weights.overtradeRisk >= 0.55) {
    s.push({
      id: "freq-high",
      title: { id: "Kencangkan batas frekuensi", en: "Tighten frequency limits" },
      detail: {
        id: "Overtrade terukur - gate harus selaras dengan frekuensi tinggi, bukan dilonggarkan.",
        en: "Measured overtrade - gate must match high frequency, not loosen.",
      },
      patch: {
        signal: { tradeFrequency: "high" },
        rules: { maxTradesPerSession: 2 },
      },
    });
  }
  if (weights && weights.hesitation >= 0.55 && edge.length > 0 && edge[0].net > 0) {
    s.push({
      id: "hesitation-edge",
      title: { id: "Fokus edge zone terbukti", en: "Focus proven edge zone" },
      detail: {
        id: `Edge terkuat: ${edge[0].label}. Kurangi hesitation di sini.`,
        en: `Strongest edge: ${edge[0].label}. Reduce hesitation here.`,
      },
      patch: { signal: { confidenceShift: "stable" } },
    });
  }
  return s;
}

export function buildAnalyticsReport(
  entries: JournalEntry[],
  opts?: { weights?: BehaviorRiskWeights | null; locale?: "id" | "en" }
): AnalyticsReport {
  const locale = opts?.locale ?? "id";
  const weights = opts?.weights ?? null;
  const pnl = entries.filter((e) => isPnlKind(e.kind));
  const closed = closedPnlRows(pnl);

  const symbols = toEdgeRows(groupBySymbol(pnl), (k) => k);
  const sessions = toEdgeRows(groupBySession(pnl), (k) => sessionLabel(k as never, locale));
  const assets = toEdgeRows(groupByAsset(pnl), (k) => k);

  const focus: AnalyticsReport["focus"] =
    weights && weights.overtradeRisk >= 0.55
      ? "overtrade"
      : weights && weights.hesitation >= 0.55
        ? "hesitation"
        : "balanced";

  const top = symbols[0] ?? sessions[0] ?? assets[0];
  const headline =
    top && top.net > 0
      ? {
          id: `Trade lebih di ${top.label}, kurangi di bucket net negatif.`,
          en: `Trade more ${top.label}, cut negative buckets.`,
        }
      : {
          id: "Sample belum cukup atau edge belum jelas. Log lebih banyak close.",
          en: "Sample thin or edge unclear. Log more closes.",
        };

  const leakage = detectLeakage(pnl, locale);
  if (focus === "overtrade") {
    leakage.sort((a) => (a.id === "overtrade" ? -1 : 0));
  }

  const context = buildContext(pnl, locale);
  const drift = buildDrift(pnl, locale);
  const suggestions = buildSuggestions(leakage, weights, symbols);

  return {
    sampleClosed: closed.length,
    focus,
    edge: { symbols, sessions, assets, headline },
    leakage,
    context,
    drift,
    suggestions,
    weights,
  };
}

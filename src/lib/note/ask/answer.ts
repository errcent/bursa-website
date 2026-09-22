/**
 * Deterministic Ask Your Journal (no LLM, $0).
 *
 * Intent-routed answers over journal aggregates with citations pinned to
 * real trades. Every number traces to the scoped trade list — the same
 * cited-aggregates-only contract the LLM path must also honor.
 */

import { deriveSession } from "@/lib/note/edge-finder";
import { dayKey, formatPnl, type FormatPnlOpts } from "@/lib/note/stats";
import type { JournalEntry } from "@/lib/note/types";
import type { NoteLocale } from "@/lib/note/prefs";
import { citeTrade, scopedTrades, type AskScope } from "./retrieve";

export interface AskAnswer {
  intent: string;
  text: string;
  citations: string[];
}

const t = (locale: NoteLocale, id: string, en: string) => (locale === "en" ? en : id);

type Intent =
  | "winrate"
  | "best-worst"
  | "pnl"
  | "expectancy"
  | "fees"
  | "streak"
  | "drawdown"
  | "emotion"
  | "count"
  | "help";

function detectIntent(question: string): Intent {
  const q = question.toLowerCase();
  if (/(win ?rate|winrate|berapa.*menang|persen.*menang)/.test(q)) return "winrate";
  if (/(terbaik|terburuk|best|worst|edge|bocor|leak)/.test(q)) return "best-worst";
  if (/(berapa.*(pnl|profit|rugi|untung|total)|total.*(pnl|profit)|net\b)/.test(q)) return "pnl";
  if (/(expectancy|ekspektasi|\bavg\b.*\br\b|rata.*\br\b|per trade)/.test(q)) return "expectancy";
  if (/(fee|biaya|komisi|commission|cost)/.test(q)) return "fees";
  if (/(streak|beruntun|rentetan)/.test(q)) return "streak";
  if (/(drawdown|dd\b|penurunan)/.test(q)) return "drawdown";
  if (/(emosi|emotion|tilt|perasaan|feeling|psikologi)/.test(q)) return "emotion";
  if (/(berapa.*(trade|transaksi)|how many|jumlah.*trade)/.test(q)) return "count";
  return "help";
}

const HELP_TEXT: Record<NoteLocale, string> = {
  id: "Aku bisa jawab: win rate, simbol/sesi terbaik & terburuk, total PnL, ekspektasi, fee, streak, drawdown, emosi, dan jumlah trade. Contoh: berapa win rate EURUSD sesi london?",
  en: "I can answer: win rate, best & worst symbol/session, total PnL, expectancy, fees, streak, drawdown, emotion, and trade count. Example: what is my win rate on EURUSD london session?",
};

export function answerAsk(
  entries: JournalEntry[],
  question: string,
  scope: AskScope,
  locale: NoteLocale,
  fmt: FormatPnlOpts,
): AskAnswer {
  const intent = detectIntent(question);
  const trades = scopedTrades(entries, scope);
  const scopeNote =
    (scope.symbols?.length ?? 0) + (scope.sessions?.length ?? 0) > 0
      ? t(locale, " (dalam filter)", " (in filter)")
      : "";

  if (intent === "help" || trades.length === 0) {
    return {
      intent: trades.length === 0 ? "count" : "help",
      text: trades.length === 0
        ? t(locale, `Belum ada trade tertutup${scopeNote}.`, `No closed trades yet${scopeNote}.`)
        : HELP_TEXT[locale],
      citations: [],
    };
  }

  const wins = trades.filter((e) => (e.pnl ?? 0) > 0);
  const net = trades.reduce((a, e) => a + (e.pnl ?? 0), 0);

  switch (intent) {
    case "winrate": {
      const pct = Math.round((wins.length / trades.length) * 100);
      return {
        intent,
        text: t(
          locale,
          `Win rate ${pct}% dari ${trades.length} trade${scopeNote}: ${wins.length} menang, ${trades.length - wins.length} kalah/impas.`,
          `Win rate ${pct}% across ${trades.length} trades${scopeNote}: ${wins.length} wins, ${trades.length - wins.length} losses/flat.`,
        ),
        citations: wins.slice(0, 3).map(citeTrade),
      };
    }
    case "best-worst": {
      const bySymbol = new Map<string, { net: number; n: number }>();
      for (const e of trades) {
        const row = bySymbol.get(e.symbol) ?? { net: 0, n: 0 };
        row.net += e.pnl ?? 0;
        row.n += 1;
        bySymbol.set(e.symbol, row);
      }
      const ranked = [...bySymbol.entries()].sort((a, b) => b[1].net - a[1].net);
      const best = ranked[0]!;
      const worst = ranked[ranked.length - 1]!;
      return {
        intent,
        text: t(
          locale,
          `Terbaik: ${best[0]} ${formatPnl(best[1].net, fmt)} (${best[1].n} trade). Terburuk: ${worst[0]} ${formatPnl(worst[1].net, fmt)} (${worst[1].n} trade).`,
          `Best: ${best[0]} ${formatPnl(best[1].net, fmt)} (${best[1].n} trades). Worst: ${worst[0]} ${formatPnl(worst[1].net, fmt)} (${worst[1].n} trades).`,
        ),
        citations: [
          ...trades.filter((e) => e.symbol === best[0]).slice(0, 2).map(citeTrade),
          ...trades.filter((e) => e.symbol === worst[0]).slice(0, 2).map(citeTrade),
        ],
      };
    }
    case "pnl": {
      return {
        intent,
        text: t(
          locale,
          `Net ${formatPnl(net, fmt)} dari ${trades.length} trade${scopeNote}.`,
          `Net ${formatPnl(net, fmt)} across ${trades.length} trades${scopeNote}.`,
        ),
        citations: [...trades].sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0)).slice(0, 3).map(citeTrade),
      };
    }
    case "expectancy": {
      const perTrade = net / trades.length;
      const rs = trades.map((e) => e.actualRR).filter((r): r is number => r != null && Number.isFinite(r));
      const avgR = rs.length > 0 ? rs.reduce((a, b) => a + b, 0) / rs.length : null;
      return {
        intent,
        text: t(
          locale,
          `Ekspektasi ${formatPnl(perTrade, fmt)} per trade${avgR != null ? ` · rata-rata ${avgR >= 0 ? "+" : ""}${avgR.toFixed(2)}R dari ${rs.length} trade ber-SL` : ""}.`,
          `Expectancy ${formatPnl(perTrade, fmt)} per trade${avgR != null ? ` · average ${avgR >= 0 ? "+" : ""}${avgR.toFixed(2)}R across ${rs.length} stopped trades` : ""}.`,
        ),
        citations: [],
      };
    }
    case "fees": {
      const fees = trades.reduce((a, e) => a + Math.abs(e.fees ?? 0), 0);
      const gross = trades.reduce((a, e) => a + Math.max(0, e.pnl ?? 0), 0);
      const share = gross > 0 ? ` (${Math.round((fees / gross) * 100)}% laba kotor)` : "";
      const shareEn = gross > 0 ? ` (${Math.round((fees / gross) * 100)}% of gross)` : "";
      return {
        intent,
        text: t(
          locale,
          `Total fee ${formatPnl(fees, fmt)} dari ${trades.length} trade${share}.`,
          `Total fees ${formatPnl(fees, fmt)} across ${trades.length} trades${shareEn}.`,
        ),
        citations: [],
      };
    }
    case "streak": {
      const ordered = [...trades].sort((a, b) => a.openedAt.localeCompare(b.openedAt));
      let run = 0;
      for (let i = ordered.length - 1; i >= 0; i -= 1) {
        const pnl = ordered[i]!.pnl ?? 0;
        if (pnl === 0) continue;
        const dir = pnl > 0 ? 1 : -1;
        if (run === 0) run = dir;
        else if (Math.sign(run) === dir) run += dir;
        else break;
      }
      return {
        intent,
        text:
          run === 0
            ? t(locale, "Belum ada streak berjalan.", "No live streak.")
            : run > 0
              ? t(locale, `Streak menang ${run}x berjalan.`, `Live ${run}x win streak.`)
              : t(locale, `Streak kalah ${Math.abs(run)}x berjalan — pertimbangkan jeda.`, `Live ${Math.abs(run)}x losing streak — consider a break.`),
        citations: ordered.slice(-3).map(citeTrade),
      };
    }
    case "drawdown": {
      const ordered = [...trades].sort((a, b) => a.openedAt.localeCompare(b.openedAt));
      let cum = 0;
      let peak = 0;
      let maxDD = 0;
      for (const e of ordered) {
        cum += e.pnl ?? 0;
        if (cum > peak) peak = cum;
        maxDD = Math.max(maxDD, peak - cum);
      }
      return {
        intent,
        text: t(
          locale,
          `Max drawdown ${formatPnl(maxDD, fmt)}${scopeNote}.`,
          `Max drawdown ${formatPnl(maxDD, fmt)}${scopeNote}.`,
        ),
        citations: [],
      };
    }
    case "emotion": {
      const withEmo = trades.filter((e) => e.emotion?.trim());
      if (withEmo.length < 3) {
        return {
          intent,
          text: t(locale, "Butuh ≥3 trade berlabel emosi untuk pola.", "Need 3+ emotion-labeled trades for a pattern."),
          citations: [],
        };
      }
      const byEmo = new Map<string, { n: number; wins: number }>();
      for (const e of withEmo) {
        const key = e.emotion!.trim().toLowerCase();
        const row = byEmo.get(key) ?? { n: 0, wins: 0 };
        row.n += 1;
        if ((e.pnl ?? 0) > 0) row.wins += 1;
        byEmo.set(key, row);
      }
      const ranked = [...byEmo.entries()]
        .filter(([, r]) => r.n >= 2)
        .sort((a, b) => b[1].wins / b[1].n - a[1].wins / a[1].n);
      if (ranked.length === 0) {
        return { intent, text: t(locale, "Belum ada emosi yang muncul ≥2x.", "No emotion appears 2+ times yet."), citations: [] };
      }
      const [bestEmo, bestRow] = ranked[0]!;
      const [worstEmo, worstRow] = ranked[ranked.length - 1]!;
      return {
        intent,
        text: t(
          locale,
          `"${bestEmo}" menang ${Math.round((bestRow.wins / bestRow.n) * 100)}% · "${worstEmo}" menang ${Math.round((worstRow.wins / worstRow.n) * 100)}%.`,
          `"${bestEmo}" wins ${Math.round((bestRow.wins / bestRow.n) * 100)}% · "${worstEmo}" wins ${Math.round((worstRow.wins / worstRow.n) * 100)}%.`,
        ),
        citations: withEmo.filter((e) => e.emotion!.trim().toLowerCase() === bestEmo).slice(0, 2).map(citeTrade),
      };
    }
    case "count":
    default: {
      const days = new Set(trades.map((e) => dayKey(e.openedAt)));
      return {
        intent: "count",
        text: t(
          locale,
          `${trades.length} trade tertutup di ${days.size} hari${scopeNote}.`,
          `${trades.length} closed trades across ${days.size} days${scopeNote}.`,
        ),
        citations: [],
      };
    }
  }
}

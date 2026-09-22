/**
 * Deterministic session recaps + trade critiques (no LLM, $0).
 *
 * Rule-based reflection over journal entries: every bullet is traceable
 * to a concrete number (no hallucinated advice). Versioned alongside the
 * data it reads so recaps stay comparable over time.
 */

import { deriveSession } from "@/lib/note/edge-finder";
import { dayKey, formatPnl, type FormatPnlOpts } from "@/lib/note/stats";
import { isPnlKind, type JournalEntry } from "@/lib/note/types";
import type { NoteLocale } from "@/lib/note/prefs";

export const RECAP_VERSION = 1;

export interface SessionRecap {
  version: number;
  day: string;
  headline: string;
  bullets: string[];
  tone: "up" | "down" | "neutral";
}

export interface TradeCritique {
  entryId: string;
  symbol: string;
  bullets: string[];
  fix: string;
  tone: "up" | "down" | "neutral";
}

const t = (locale: NoteLocale, id: string, en: string) => (locale === "en" ? en : id);

function closedTrades(entries: JournalEntry[]): JournalEntry[] {
  return entries.filter((e) => isPnlKind(e.kind) && e.pnl != null && e.result !== "open");
}

/** Latest trading day present in the journal (better default than wall-clock today). */
export function latestTradingDay(entries: JournalEntry[]): string | null {
  const days = closedTrades(entries).map((e) => dayKey(e.openedAt));
  if (days.length === 0) return null;
  return days.sort().reverse()[0]!;
}

export function buildSessionRecap(
  entries: JournalEntry[],
  day: string,
  locale: NoteLocale,
  fmt: FormatPnlOpts,
): SessionRecap | null {
  const dayTrades = closedTrades(entries).filter((e) => dayKey(e.openedAt) === day);
  if (dayTrades.length === 0) return null;

  const net = dayTrades.reduce((a, e) => a + (e.pnl ?? 0), 0);
  const wins = dayTrades.filter((e) => (e.pnl ?? 0) > 0).length;
  const losses = dayTrades.filter((e) => (e.pnl ?? 0) < 0).length;
  const fees = dayTrades.reduce((a, e) => a + Math.abs(e.fees ?? 0), 0);
  const grossProfit = dayTrades.reduce((a, e) => a + Math.max(0, e.pnl ?? 0), 0);
  const best = [...dayTrades].sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0))[0]!;
  const worst = [...dayTrades].sort((a, b) => (a.pnl ?? 0) - (b.pnl ?? 0))[0]!;

  const bullets: string[] = [];
  bullets.push(
    t(
      locale,
      `Terbaik: ${best.symbol} ${formatPnl(best.pnl ?? 0, fmt)} (${deriveSession(best.openedAt)}). Terburuk: ${worst.symbol} ${formatPnl(worst.pnl ?? 0, fmt)} (${deriveSession(worst.openedAt)}).`,
      `Best: ${best.symbol} ${formatPnl(best.pnl ?? 0, fmt)} (${deriveSession(best.openedAt)}). Worst: ${worst.symbol} ${formatPnl(worst.pnl ?? 0, fmt)} (${deriveSession(worst.openedAt)}).`,
    ),
  );

  if (grossProfit > 0 && fees / grossProfit > 0.05) {
    bullets.push(
      t(
        locale,
        `Fee memakan ${Math.round((fees / grossProfit) * 100)}% laba kotor hari ini — cek ukuran posisi vs spread/komisi.`,
        `Fees ate ${Math.round((fees / grossProfit) * 100)}% of today's gross profit — check size vs spread/commission.`,
      ),
    );
  }

  const lossSessions = dayTrades
    .filter((e) => (e.pnl ?? 0) < 0)
    .map((e) => deriveSession(e.openedAt));
  const sessionCounts = new Map<string, number>();
  for (const s of lossSessions) sessionCounts.set(s, (sessionCounts.get(s) ?? 0) + 1);
  const worstSession = [...sessionCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (worstSession && worstSession[1] >= 2) {
    bullets.push(
      t(
        locale,
        `${worstSession[1]} rugi terjadi di sesi ${worstSession[0]} — pertimbangkan batasi sesi itu besok.`,
        `${worstSession[1]} losses clustered in ${worstSession[0]} session — consider capping that session tomorrow.`,
      ),
    );
  }

  const noThesisLosses = dayTrades.filter((e) => (e.pnl ?? 0) < 0 && !e.thesis?.trim()).length;
  if (noThesisLosses >= 2) {
    bullets.push(
      t(
        locale,
        `${noThesisLosses} rugi tanpa thesis tercatat — tulis "kenapa entry" sebelum entry berikutnya.`,
        `${noThesisLosses} losses had no recorded thesis — write "why enter" before the next entry.`,
      ),
    );
  }

  if (losses >= 3 && losses > wins) {
    bullets.push(
      t(
        locale,
        "Hari merah beruntun — jeda 24 jam mengalahkan balas dendam. Terakhir kali jeda, hasil memantul.",
        "Losing day with a streak — a 24h break beats revenge. Breaks bounced back before.",
      ),
    );
  }

  return {
    version: RECAP_VERSION,
    day,
    headline: `${day}: ${formatPnl(net, fmt)} · ${wins}W-${losses}L · ${dayTrades.length} close`,
    bullets: bullets.slice(0, 4),
    tone: net > 0 ? "up" : net < 0 ? "down" : "neutral",
  };
}

export function buildTradeCritique(
  entry: JournalEntry,
  peerAvgR: number | null,
  locale: NoteLocale,
  fmt: FormatPnlOpts,
): TradeCritique {
  const bullets: string[] = [];
  const pnl = entry.pnl ?? 0;
  const r = entry.actualRR;
  const planned = entry.plannedRR;

  if (r != null && Number.isFinite(r)) {
    bullets.push(
      t(
        locale,
        `Realisasi ${r >= 0 ? "+" : ""}${r.toFixed(1)}R dari ${formatPnl(pnl, fmt)}${planned != null ? ` vs rencana ${planned.toFixed(1)}R` : ""}.`,
        `Realized ${r >= 0 ? "+" : ""}${r.toFixed(1)}R for ${formatPnl(pnl, fmt)}${planned != null ? ` vs planned ${planned.toFixed(1)}R` : ""}.`,
      ),
    );
    if (peerAvgR != null && r < peerAvgR - 0.5) {
      bullets.push(
        t(
          locale,
          `Di bawah rata-rata R kamu (${peerAvgR.toFixed(1)}R) — exit terlalu cepat atau SL terlalu lebar.`,
          `Below your average R (${peerAvgR.toFixed(1)}R) — exited early or stop too wide.`,
        ),
      );
    }
  } else {
    bullets.push(
      t(
        locale,
        `Tanpa SL tercatat, R tidak bisa dihitung — tambah SL agar trade ini bisa dibandingkan.`,
        `No recorded stop, so R is unknowable — add a stop so this trade can be compared.`,
      ),
    );
  }

  if (!entry.thesis?.trim()) {
    bullets.push(
      t(
        locale,
        `Tanpa thesis — tidak bisa dibedakan skill vs luck. Tulis satu kalimat setup.`,
        `No thesis — skill vs luck is indistinguishable. Write one setup sentence.`,
      ),
    );
  }

  const emo = (entry.emotion ?? "").toLowerCase();
  if (pnl < 0 && /revenge|balas|fomo|marah|angry|takut|fear/.test(emo)) {
    bullets.push(
      t(
        locale,
        `Emosi "${entry.emotion}" + rugi = pola tilt. Tandai setup ini untuk jeda wajib.`,
        `Emotion "${entry.emotion}" + loss = tilt pattern. Flag this setup for a mandatory pause.`,
      ),
    );
  }

  const feeShare = pnl !== 0 ? Math.abs(entry.fees ?? 0) / Math.abs(pnl) : 0;
  if (feeShare > 0.1) {
    bullets.push(
      t(
        locale,
        `Fee ${Math.round(feeShare * 100)}% dari hasil — size terlalu kecil untuk biaya ini.`,
        `Fees are ${Math.round(feeShare * 100)}% of outcome — size too small for this cost.`,
      ),
    );
  }

  const fix =
    pnl < 0 && !entry.thesis?.trim()
      ? t(locale, "Fix: wajib thesis 1 kalimat sebelum entry berikutnya.", "Fix: require a 1-sentence thesis before the next entry.")
      : r != null && peerAvgR != null && r < peerAvgR - 0.5
        ? t(locale, "Fix: tahan winner sampai target atau trail terpicu.", "Fix: hold winners to target or trail trigger.")
        : feeShare > 0.1
          ? t(locale, "Fix: naikkan size atau pindah instrumen berbiaya rendah.", "Fix: raise size or switch to a cheaper instrument.")
          : t(locale, "Fix: ulangi setup ini persis — ini edge kamu.", "Fix: repeat this exact setup — this is your edge.");

  return {
    entryId: entry.id,
    symbol: entry.symbol,
    bullets: bullets.slice(0, 3),
    fix,
    tone: pnl > 0 ? "up" : pnl < 0 ? "down" : "neutral",
  };
}

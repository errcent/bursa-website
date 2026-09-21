import type { NoteLocale } from "@/lib/note/prefs";
import { dayKey, summarizeJournal, type JournalSnapshot } from "@/lib/note/stats";
import type { JournalEntry } from "@/lib/note/types";
import { isPnlKind } from "@/lib/note/types";

export type NoteInsight = {
  tone: "neutral" | "warn" | "positive";
  text: string;
};

function consecutiveLossDays(entries: JournalEntry[], nowIso: string): number {
  const byDay = new Map<string, number>();
  for (const e of entries.filter((entry) => isPnlKind(entry.kind))) {
    if (e.pnl == null) continue;
    const d = dayKey(e.openedAt);
    byDay.set(d, (byDay.get(d) ?? 0) + e.pnl);
  }
  let cursor = dayKey(nowIso);
  let streak = 0;
  const shift = (date: string, delta: number) => {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
  };
  if (!byDay.has(cursor)) cursor = shift(cursor, -1);
  while (byDay.has(cursor) && (byDay.get(cursor) ?? 0) < 0) {
    streak += 1;
    cursor = shift(cursor, -1);
  }
  return streak;
}

export function buildNoteInsights(
  entries: JournalEntry[],
  snapshot: JournalSnapshot,
  locale: NoteLocale,
  nowIso = new Date().toISOString()
): NoteInsight[] {
  const out: NoteInsight[] = [];
  const lossDays = consecutiveLossDays(entries, nowIso);

  if (lossDays >= 3) {
    out.push({
      tone: "warn",
      text:
        locale === "en"
          ? `${lossDays} red days in a row - pause size or step away before revenge trading.`
          : `${lossDays} hari merah berturut - kecilkan size atau break dulu sebelum revenge trade.`,
    });
  } else if (snapshot.closedCount >= 8 && snapshot.winRate != null && snapshot.winRate < 0.4) {
    out.push({
      tone: "warn",
      text:
        locale === "en"
          ? `Win rate ${Math.round(snapshot.winRate * 100)}% on ${snapshot.closedCount} closes - review filters in Journal.`
          : `Win rate ${Math.round(snapshot.winRate * 100)}% dari ${snapshot.closedCount} close - cek filter di Journal.`,
    });
  }

  if (snapshot.expectancy != null && snapshot.expectancy > 0 && snapshot.closedCount >= 5) {
    out.push({
      tone: "positive",
      text:
        locale === "en"
          ? "Positive expectancy on recent closes - protect the edge, don't size up on emotion."
          : "Expectancy positif di close terbaru - jaga edge, jangan naikkan size karena euforia.",
    });
  } else if (snapshot.pnlSum > 0 && snapshot.closedCount >= 3) {
    out.push({
      tone: "positive",
      text:
        locale === "en"
          ? "Net green on the active window - note what you did right while it's fresh."
          : "Net hijau di rentang aktif - catat apa yang benar selagi masih fresh.",
    });
  }

  if (out.length === 0) {
    out.push({
      tone: "neutral",
      text:
        locale === "en"
          ? "Log one trade with setup in notes - insights sharpen after a few closes."
          : "Log satu trade dengan setup di catatan - insight menguat setelah beberapa close.",
    });
  }

  return out.slice(0, 2);
}

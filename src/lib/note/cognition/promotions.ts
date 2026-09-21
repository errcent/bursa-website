import { classifyNoteText } from "@/lib/note/cognition/tags";
import type { BeliefPromotion } from "@/lib/note/cognition/types";
import { isPnlKind, type JournalEntry } from "@/lib/note/types";

function noteEntries(entries: JournalEntry[]): JournalEntry[] {
  return entries.filter(
    (e) =>
      e.kind === "REFLEKSI" ||
      e.side === "NOTE" ||
      Boolean(e.note?.trim() && !isPnlKind(e.kind))
  );
}

function normalizeSnippet(text: string, max = 48): string {
  const s = text.trim().replace(/\s+/g, " ");
  return s.length <= max ? s : `${s.slice(0, max)}…`;
}

export function buildBeliefPromotions(
  entries: JournalEntry[],
  locale: "id" | "en"
): BeliefPromotion[] {
  const notes = noteEntries(entries);
  const trades = entries.filter((e) => isPnlKind(e.kind));
  const out: BeliefPromotion[] = [];

  const tagCounts = new Map<string, number>();
  const ideaSnippets = new Map<string, number>();

  for (const n of notes) {
    const text = [n.note, n.lesson, n.ruleBroken].filter(Boolean).join(" ");
    for (const tag of classifyNoteText(text)) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    const key = normalizeSnippet(n.note ?? "", 64).toLowerCase();
    if (key.length > 12) ideaSnippets.set(key, (ideaSnippets.get(key) ?? 0) + 1);
  }

  for (const [snippet, count] of ideaSnippets) {
    if (count >= 3) {
      out.push({
        id: `repeat-${snippet.slice(0, 12)}`,
        kind: "analytics_pattern",
        title: {
          id: "Ide berulang",
          en: "Repeated idea",
        },
        detail: {
          id: `"${snippet}" muncul ${count}×. Lihat Analytics untuk pola terkait.`,
          en: `"${snippet}" appears ${count}×. Check Analytics for related patterns.`,
        },
        href: "/note/analytics",
        beliefSnippet: snippet,
      });
      break;
    }
  }

  const psychBeforeLoss = notes.filter((n) => {
    const tags = classifyNoteText(n.note ?? "");
    if (!tags.includes("emotion_psych") && !tags.includes("trade_idea")) return false;
    const t0 = Date.parse(n.openedAt);
    return trades.some(
      (tr) =>
        tr.result === "loss" &&
        Date.parse(tr.openedAt) > t0 &&
        Date.parse(tr.openedAt) - t0 < 48 * 3600000
    );
  });
  if (psychBeforeLoss.length >= 2) {
    out.push({
      id: "pre-loss-psych",
      kind: "risk_warning",
      title: {
        id: "Catatan emosi/ide sebelum loss",
        en: "Emotion/idea notes before losses",
      },
      detail: {
        id: `${psychBeforeLoss.length} belief note dalam 48j sebelum trade rugi - cek di Analytics.`,
        en: `${psychBeforeLoss.length} belief notes within 48h before losing trades - see Analytics.`,
      },
      href: "/note/analytics",
    });
  }

  const macroCount = tagCounts.get("macro_news") ?? 0;
  if (macroCount >= 3) {
    out.push({
      id: "macro-pattern",
      kind: "analytics_pattern",
      title: { id: "Pola makro berulang", en: "Repeating macro theme" },
      detail: {
        id: `${macroCount} catatan makro/news - selaraskan dengan filter News.`,
        en: `${macroCount} macro/news notes - align with News filter.`,
      },
      href: "/note/news",
    });
  }

  const ideas = notes.filter((n) => classifyNoteText(n.note ?? "").includes("trade_idea"));
  const executedAfter = ideas.filter((n) => {
    const t0 = Date.parse(n.openedAt);
    return trades.some((tr) => Date.parse(tr.openedAt) >= t0 && Date.parse(tr.openedAt) - t0 < 7 * 86400000);
  });
  if (ideas.length >= 3 && executedAfter.length < ideas.length / 2) {
    out.push({
      id: "unexecuted",
      kind: "unexecuted_idea",
      title: { id: "Ide sering tidak dieksekusi", en: "Ideas often not executed" },
      detail: {
        id: `${ideas.length} trade idea notes, sedikit yang diikuti Journal - hesitation atau disiplin?`,
        en: `${ideas.length} trade idea notes, few matched in Journal - hesitation or discipline?`,
      },
      href: "/note/analytics",
    });
  }

  return out.slice(0, 4);
}

export function isBeliefEntry(entry: JournalEntry): boolean {
  if (entry.kind === "REFLEKSI") return true;
  if (entry.side === "NOTE") return true;
  return Boolean(entry.note?.trim()) && !isPnlKind(entry.kind);
}

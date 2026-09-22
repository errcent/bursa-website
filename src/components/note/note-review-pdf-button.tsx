"use client";

import { useMemo } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { NOTE_EXECUTION_KIND } from "@/lib/note/sections";
import { summarizeAdherence } from "@/lib/note/playbook/adherence";
import { generateEdgeInsight } from "@/lib/note/edge-finder";
import { pnlOptsFromPrefs } from "@/lib/note/prefs";
import { saveReviewPdf } from "@/lib/note/review-pdf";
import { dayKey, filterEntries, formatPnl, summarizeJournal } from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

/** One-click review PDF export (client-side jsPDF, $0). */
export function NoteReviewPdfButton() {
  const [prefs] = useNotePrefs();
  const journal = useNoteJournal();
  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);
  const formatOpts = pnlOptsFromPrefs(prefs);

  const payload = useMemo(() => {
    const scoped = filterEntries(journal.data?.entries ?? [], {
      kind: NOTE_EXECUTION_KIND,
      result: "ALL",
    }).filter((e) => isPnlKind(e.kind));
    const min7 = dayKey(new Date(Date.now() - 7 * 86400000).toISOString());
    const min31 = dayKey(new Date(Date.now() - 31 * 86400000).toISOString());
    const week = summarizeJournal(scoped.filter((e) => dayKey(e.openedAt) >= min7));
    const month = summarizeJournal(scoped.filter((e) => dayKey(e.openedAt) >= min31));
    const adherence = summarizeAdherence(scoped);
    const edge = generateEdgeInsight(scoped, prefs.locale);
    const fmtMeta = (s: { closedCount: number; winRate: number | null }) =>
      `${s.closedCount} close · ${s.winRate == null ? "-" : `${Math.round(s.winRate * 100)}% win`}`;
    return {
      locale: prefs.locale,
      generatedAt: new Date().toISOString(),
      weekNet: formatPnl(week.pnlSum, formatOpts),
      weekMeta: fmtMeta(week),
      monthNet: formatPnl(month.pnlSum, formatOpts),
      monthMeta: fmtMeta(month),
      mistake:
        month.losses > month.wins && month.closedCount >= 3
          ? t("Loss lebih banyak dari win bulan ini.", "Losses outnumber wins this month.")
          : t("Belum ada pola mistake dominan.", "No dominant mistake pattern."),
      adherence:
        adherence.followed.trades + adherence.broken.trades > 0
          ? `${t("Ikut", "Followed")} ${formatPnl(adherence.followed.net, formatOpts)} · ${t("Langgar", "Broken")} ${formatPnl(adherence.broken.net, formatOpts)}`
          : null,
      edge: edge?.text ?? null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journal.data, prefs.locale]);

  if (journal.loading || !journal.data) return null;

  return (
    <button
      type="button"
      onClick={() => saveReviewPdf(payload)}
      className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md border border-zinc-700 px-3 text-xs text-zinc-200 hover:bg-zinc-800"
    >
      {t("Ekspor PDF", "Export PDF")}
    </button>
  );
}

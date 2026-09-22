"use client";

import { useMemo } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { NOTE_EXECUTION_KIND } from "@/lib/note/sections";
import {
  buildSessionRecap,
  buildTradeCritique,
  latestTradingDay,
} from "@/lib/note/recap";
import { pnlOptsFromPrefs } from "@/lib/note/prefs";
import { filterEntries } from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { NoteTradeReplay } from "@/components/note/note-trade-replay";
import { cn } from "@/lib/utils";

/**
 * Deterministic recaps + critiques ($0, no LLM).
 * Every bullet traces to a concrete number — no hallucinated advice.
 */
export function NoteSessionRecap() {
  const [prefs] = useNotePrefs();
  const journal = useNoteJournal();
  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);
  const fmt = pnlOptsFromPrefs(prefs);

  const recap = useMemo(() => {
    const scoped = filterEntries(journal.data?.entries ?? [], {
      kind: NOTE_EXECUTION_KIND,
      result: "ALL",
    }).filter((e) => isPnlKind(e.kind));
    const day = latestTradingDay(scoped);
    if (!day) return null;
    return buildSessionRecap(scoped, day, prefs.locale, fmt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journal.data, prefs.locale]);

  if (!recap) return null;

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {t("Rekap sesi", "Session recap")} · v{recap.version}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-medium",
          recap.tone === "up" && "text-emerald-200",
          recap.tone === "down" && "text-rose-200",
          recap.tone === "neutral" && "text-zinc-100",
        )}
      >
        {recap.headline}
      </p>
      <ul className="mt-2 space-y-1.5">
        {recap.bullets.map((b, i) => (
          <li key={i} className="text-sm leading-snug text-zinc-300">
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NoteTradeCritiques() {
  const [prefs] = useNotePrefs();
  const journal = useNoteJournal();
  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);
  const fmt = pnlOptsFromPrefs(prefs);

  const critiques = useMemo(() => {
    const scoped = filterEntries(journal.data?.entries ?? [], {
      kind: NOTE_EXECUTION_KIND,
      result: "ALL",
    }).filter((e) => isPnlKind(e.kind) && e.pnl != null && e.result !== "open");
    if (scoped.length === 0) return [];
    const rs = scoped
      .map((e) => e.actualRR)
      .filter((r): r is number => r != null && Number.isFinite(r));
    const peerAvgR = rs.length > 0 ? rs.reduce((a, b) => a + b, 0) / rs.length : null;
    const latest = [...scoped].sort((a, b) => b.openedAt.localeCompare(a.openedAt)).slice(0, 3);
    return latest.map((e) => buildTradeCritique(e, peerAvgR, prefs.locale, fmt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journal.data, prefs.locale]);

  if (critiques.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {t("Kritik 3 trade terakhir", "Last 3 trade critiques")}
      </p>
      <ul className="mt-2 space-y-3">
        {critiques.map((c) => (
          <li key={c.entryId} className="border-t border-zinc-800/60 pt-2 first:border-t-0 first:pt-0">
            <p
              className={cn(
                "text-sm font-medium",
                c.tone === "up" && "text-emerald-200",
                c.tone === "down" && "text-rose-200",
                c.tone === "neutral" && "text-zinc-100",
              )}
            >
              {c.symbol}
            </p>
            <ul className="mt-1 space-y-1">
              {c.bullets.map((b, i) => (
                <li key={i} className="text-xs leading-snug text-zinc-400">
                  {b}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs font-medium text-zinc-200">{c.fix}</p>
            <NoteTradeReplay entryId={c.entryId} symbol={c.symbol} />
          </li>
        ))}
      </ul>
    </div>
  );
}

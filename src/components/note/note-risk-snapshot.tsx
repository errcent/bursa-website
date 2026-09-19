"use client";

import type { JournalSnapshot } from "@/lib/note/stats";
import type { JournalEntry } from "@/lib/note/types";
import { cn } from "@/lib/utils";

export function NoteRiskSnapshot({
  entries,
  snapshot,
  locale,
}: {
  entries: JournalEntry[];
  snapshot: JournalSnapshot;
  locale: "id" | "en";
}) {
  const openCount = entries.filter((e) => e.result === "open").length;
  const symbolCounts = new Map<string, number>();
  for (const e of entries.filter((x) => x.result === "open")) {
    const s = e.symbol?.trim() || "?";
    symbolCounts.set(s, (symbolCounts.get(s) ?? 0) + 1);
  }
  const topSymbol = [...symbolCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const stable =
    openCount === 0 &&
    snapshot.pnlSum >= 0 &&
    (snapshot.winRate == null || snapshot.winRate >= 0.45);

  const title = locale === "en" ? "Risk exposure" : "Exposure risiko";
  const statusLabel = stable
    ? locale === "en"
      ? "Stable window"
      : "Window stabil"
    : locale === "en"
      ? "Elevated attention"
      : "Perlu perhatian";

  return (
    <section className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{title}</p>
        <span
          className={cn(
            "rounded px-2 py-0.5 text-xs font-medium uppercase",
            stable ? "note-badge-up" : "note-badge-warn"
          )}
        >
          {statusLabel}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-zinc-400">{locale === "en" ? "Open trades" : "Trade open"}</dt>
          <dd className="tabular-nums text-zinc-100">{openCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-400">{locale === "en" ? "Closed (filter)" : "Close (filter)"}</dt>
          <dd className="tabular-nums text-zinc-100">{snapshot.closedCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-400">{locale === "en" ? "Win rate" : "Win rate"}</dt>
          <dd className="tabular-nums text-zinc-100">
            {snapshot.winRate != null ? `${Math.round(snapshot.winRate * 100)}%` : "-"}
          </dd>
        </div>
      </dl>
      {topSymbol ? (
        <p className="mt-3 text-xs text-zinc-400">
          {locale === "en" ? "Largest open concentration" : "Konsentrasi open terbesar"}:{" "}
          <span className="text-zinc-300">
            {topSymbol[0]} ({topSymbol[1]})
          </span>
        </p>
      ) : null}
    </section>
  );
}

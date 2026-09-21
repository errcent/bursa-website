"use client";

import { useMemo, type ReactNode } from "react";

import { NoteAnalyticsWinrate } from "@/components/note/note-analytics-winrate";
import { NoteAnalyticsWinrateTrend } from "@/components/note/note-analytics-winrate-trend";
import { NoteAnalyticsWinrateWeekday } from "@/components/note/note-analytics-winrate-weekday";
import { NoteLoadingLine } from "@/components/note/note-loading-line";
import { NoteSectionIntro } from "@/components/note/note-section-intro";
import { useNoteJournal } from "@/components/note/note-journal-context";
import { NOTE_EXECUTION_KIND } from "@/lib/note/sections";
import { buildAnalyticsReport } from "@/lib/note/analytics";
import { pnlOptsForSlot } from "@/lib/note/prefs";
import { filterEntries, formatPnl } from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";
import { noteCopy } from "@/lib/note/copy";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

const ZONE_CLASS = {
  high: "note-surface-up-muted border",
  neutral: "note-surface-warn-muted border",
  avoid: "note-surface-down-muted border",
};

function AnalyticsSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="scroll-mt-20 space-y-3 border-t border-zinc-800/70 pt-6 first:border-t-0 first:pt-0">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-100">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-zinc-400">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

type InsightCard = {
  id: string;
  kind: "strength" | "leak" | "context" | "drift";
  title: string;
  detail: string;
  tone: "up" | "down" | "neutral" | "warn";
  meta?: string;
};

export function NoteAnalyticsView() {
  const [prefs] = useNotePrefs();
  const locale = prefs.locale;
  const copy = noteCopy(locale);
  const weekStart = prefs.weekStart;
  const formatOpts = pnlOptsForSlot(prefs, "analytics");
  const kind = NOTE_EXECUTION_KIND;
  const journal = useNoteJournal();

  const kindScoped = useMemo(
    () => filterEntries(journal.data?.entries ?? [], { kind, result: "ALL" }),
    [journal.data, kind]
  );
  const heroEntries = useMemo(() => kindScoped.filter((e) => isPnlKind(e.kind)), [kindScoped]);

  const report = useMemo(
    () => buildAnalyticsReport(heroEntries, { weights: null, locale }),
    [heroEntries, locale]
  );

  const insights = useMemo(() => {
    const cards: InsightCard[] = [];

    for (const row of report.edge.symbols.slice(0, 3)) {
      cards.push({
        id: `edge-sym-${row.label}`,
        kind: "strength",
        title: row.label,
        detail:
          locale === "en"
            ? `Stronger on this symbol/setup · ${row.closed} closes`
            : `Lebih kuat di simbol/setup ini · ${row.closed} close`,
        tone: row.net >= 0 ? "up" : "down",
        meta: `${formatPnl(row.net, formatOpts)}${row.winRate == null ? "" : ` · ${Math.round(row.winRate * 100)}% W`}`,
      });
    }
    for (const row of report.edge.sessions.slice(0, 2)) {
      cards.push({
        id: `edge-ses-${row.label}`,
        kind: "strength",
        title: row.label,
        detail: locale === "en" ? "Session pocket" : "Pocket sesi",
        tone: row.net >= 0 ? "up" : "down",
        meta: formatPnl(row.net, formatOpts),
      });
    }
    for (const l of report.leakage) {
      cards.push({
        id: `leak-${l.id}`,
        kind: "leak",
        title: l.title[locale],
        detail: l.detail[locale],
        tone: l.severity === "high" ? "down" : "warn",
      });
    }
    for (const c of report.context) {
      cards.push({
        id: `ctx-${c.key}`,
        kind: "context",
        title: c.label[locale],
        detail:
          locale === "en"
            ? c.zone === "high"
              ? "Favor this window"
              : c.zone === "avoid"
                ? "Stay flat here"
                : "Neutral window"
            : c.zone === "high"
              ? "Prioritaskan jendela ini"
              : c.zone === "avoid"
                ? "Lebih baik flat di sini"
                : "Jendela netral",
        tone: c.zone === "high" ? "up" : c.zone === "avoid" ? "down" : "neutral",
        meta: `${formatPnl(c.net, formatOpts)} · ${c.count} close${
          c.winRate != null ? ` · ${Math.round(c.winRate * 100)}% W` : ""
        }`,
      });
    }
    for (const d of report.drift) {
      cards.push({
        id: `drift-${d.metric.en}`,
        kind: "drift",
        title: d.metric[locale],
        detail:
          locale === "en"
            ? `Last 7d vs prior 7d · ${d.prior} → ${d.recent}`
            : `7 hari vs 7 hari sebelumnya · ${d.prior} → ${d.recent}`,
        tone: d.direction === "better" ? "up" : d.direction === "worse" ? "down" : "neutral",
      });
    }

    const order = { leak: 0, strength: 1, context: 2, drift: 3 } as const;
    return cards.sort((a, b) => order[a.kind] - order[b.kind]);
  }, [report, locale, formatOpts]);

  if (journal.loading || !journal.data) {
    return <NoteLoadingLine />;
  }

  const kindLabel: Record<InsightCard["kind"], string> = {
    strength: locale === "en" ? "Strength" : "Kekuatan",
    leak: locale === "en" ? "Leak" : "Kebocoran",
    context: locale === "en" ? "Context" : "Konteks",
    drift: locale === "en" ? "Drift" : "Drift",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <NoteSectionIntro sectionId="analytics" />

      <p className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-300">
        {report.edge.headline[locale]}
      </p>

      <AnalyticsSection
        title={locale === "en" ? "Win rate" : "Win rate"}
        hint={
          locale === "en"
            ? "Instrument mix, weekday outcome, and rolling win rate."
            : "Mix instrumen, hasil per hari, dan win rate rolling."
        }
      >
        <div className="space-y-5">
          <NoteAnalyticsWinrate entries={heroEntries} locale={locale} />
          <div className="border-t border-zinc-800/70 pt-5">
            <NoteAnalyticsWinrateWeekday entries={heroEntries} locale={locale} weekStart={weekStart} />
          </div>
          <div className="border-t border-zinc-800/70 pt-5">
            <NoteAnalyticsWinrateTrend entries={heroEntries} locale={locale} />
          </div>
        </div>
      </AnalyticsSection>

      <AnalyticsSection
        title={locale === "en" ? "Insights" : "Insight"}
        hint={
          locale === "en"
            ? "One feed: strengths, leaks, context windows, and recent drift."
            : "Satu feed: kekuatan, kebocoran, jendela konteks, dan drift."
        }
      >
        {insights.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {locale === "en"
              ? "Log more closes in Journal to surface patterns."
              : "Log lebih banyak close di Journal agar pola muncul."}
          </p>
        ) : (
          <ul className="space-y-2">
            {insights.map((card) => (
              <li
                key={card.id}
                className={cn(
                  "rounded-lg border px-4 py-3",
                  card.tone === "up"
                    ? ZONE_CLASS.high
                    : card.tone === "down"
                      ? ZONE_CLASS.avoid
                      : card.tone === "warn"
                        ? ZONE_CLASS.neutral
                        : "border-zinc-800/80 bg-zinc-900/20"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-100">{card.title}</p>
                  <span className="text-xs font-medium text-zinc-500">
                    {kindLabel[card.kind]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-400">{card.detail}</p>
                {card.meta ? (
                  <p className="mt-1.5 text-xs tabular-nums text-zinc-500">{card.meta}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </AnalyticsSection>
    </div>
  );
}

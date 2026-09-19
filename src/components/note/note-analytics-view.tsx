"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { NoteAnalyticsSurface } from "@/components/note/note-analytics-surface";
import { NoteAnalyticsWinrate } from "@/components/note/note-analytics-winrate";
import { NoteAnalyticsWinrateTrend } from "@/components/note/note-analytics-winrate-trend";
import { NoteAnalyticsWinrateWeekday } from "@/components/note/note-analytics-winrate-weekday";
import { NoteSectionIntro } from "@/components/note/note-section-intro";
import { useNoteJournal } from "@/components/note/note-journal-context";
import { NOTE_EXECUTION_KIND } from "@/lib/note/sections";
import { applyPlaybookSuggestion, buildAnalyticsReport } from "@/lib/note/analytics";
import { pnlOptsForSlot } from "@/lib/note/prefs";
import { filterEntries, formatPnl } from "@/lib/note/stats";
import { loadPlaybook, savePlaybook } from "@/lib/note/playbook/storage";
import { isPnlKind } from "@/lib/note/types";
import { noteCopy } from "@/lib/note/copy";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

const ZONE_CLASS = {
  high: "note-surface-up-muted border",
  neutral: "note-surface-warn-muted border",
  avoid: "note-surface-down-muted border",
};

const ZONE_LABEL: Record<"high" | "neutral" | "avoid", Record<"id" | "en", string>> = {
  high: { id: "Zona edge", en: "High edge" },
  neutral: { id: "Netral", en: "Neutral" },
  avoid: { id: "Hindari", en: "Avoid" },
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
        <h2 className="text-sm font-semibold tracking-tight text-zinc-100">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-zinc-400">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function EdgeTable({
  rows,
  formatOpts,
  empty,
}: {
  rows: { label: string; net: number; closed: number; winRate: number | null }[];
  formatOpts: ReturnType<typeof pnlOptsForSlot>;
  empty: string;
}) {
  if (!rows.length) return <p className="text-sm text-zinc-400">{empty}</p>;
  return (
    <ul className="divide-y divide-zinc-800/80 rounded-lg border border-zinc-800/80">
      {rows.slice(0, 6).map((r) => (
        <li key={r.label} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
          <span className="font-medium text-zinc-200">{r.label}</span>
          <span className="flex shrink-0 items-center gap-3 tabular-nums text-zinc-400">
            <span>{r.closed} close</span>
            <span>{r.winRate == null ? "-" : `${Math.round(r.winRate * 100)}% W`}</span>
            <span className={r.net >= 0 ? "note-pnl-up" : "note-pnl-down"}>
              {formatPnl(r.net, formatOpts)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function NoteAnalyticsView() {
  const [prefs] = useNotePrefs();
  const locale = prefs.locale;
  const copy = noteCopy(locale);
  const weekStart = prefs.weekStart;
  const formatOpts = pnlOptsForSlot(prefs, "analytics");
  const kind = NOTE_EXECUTION_KIND;
  const journal = useNoteJournal();
  const [weights, setWeights] = useState<ReturnType<typeof loadPlaybook>["profile"]["weights"] | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  useEffect(() => {
    const pb = loadPlaybook();
    setWeights(pb.profile.weights);
  }, []);

  const kindScoped = useMemo(
    () => filterEntries(journal.data?.entries ?? [], { kind, result: "ALL" }),
    [journal.data, kind]
  );
  const heroEntries = useMemo(() => kindScoped.filter((e) => isPnlKind(e.kind)), [kindScoped]);

  const report = useMemo(
    () => buildAnalyticsReport(heroEntries, { weights, locale }),
    [heroEntries, weights, locale]
  );

  const applySuggestion = useCallback(
    (id: string) => {
      const suggestion = report.suggestions.find((s) => s.id === id);
      if (!suggestion) return;
      const next = applyPlaybookSuggestion(loadPlaybook(), suggestion);
      savePlaybook(next);
      setWeights(next.profile.weights);
      setAppliedId(id);
    },
    [report.suggestions]
  );

  if (journal.loading || !journal.data) {
    return <p className="text-sm text-zinc-400">{copy.loading}</p>;
  }

  const focusBanner =
    report.focus === "overtrade"
      ? locale === "en"
        ? "Personal focus: overtrade leakage (minor wins de-emphasized)."
        : "Fokus personal: kebocoran overtrade (win kecil tidak di-highlight)."
      : report.focus === "hesitation"
        ? locale === "en"
          ? "Personal focus: missed edge - prioritize valid zones."
          : "Fokus personal: edge terlewat - prioritaskan zona valid."
        : null;

  const sectionTitles = {
    edge: locale === "en" ? "Edge" : "Edge",
    losses: locale === "en" ? "Leakage" : "Kebocoran",
    context: locale === "en" ? "Context zones" : "Zona konteks",
    behavior: locale === "en" ? "Behavior drift" : "Drift perilaku",
    suggestions: locale === "en" ? "Playbook suggestions" : "Usulan Playbook",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <NoteSectionIntro sectionId="analytics" />

      <p className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-300">
        {report.edge.headline[locale]}
      </p>

      {focusBanner ? <p className="text-xs text-zinc-400">{focusBanner}</p> : null}

      <AnalyticsSection
        title={locale === "en" ? "Win rate" : "Win rate"}
        hint={
          locale === "en"
            ? "Instrument mix, weekday outcome (Sun–Sat), and rolling win rate."
            : "Mix instrumen, hasil per hari Min–Sab, dan win rate rolling."
        }
      >
        <div className="space-y-5 rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
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
        title={locale === "en" ? "Context surface (3D)" : "Surface konteks (3D)"}
        hint={
          locale === "en"
            ? "Cross session × symbol to spot pockets of edge - rotate the plot to read peaks."
            : "Potong sesi × simbol untuk lihat pocket edge - putar plot untuk baca puncak."
        }
      >
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
          <NoteAnalyticsSurface entries={heroEntries} locale={locale} />
        </div>
      </AnalyticsSection>

      <AnalyticsSection
        title={sectionTitles.edge}
        hint={locale === "en" ? "Where you have advantage - trade more here." : "Di mana ada advantage - trade lebih di sini."}
      >
        <div className="grid gap-5 lg:grid-cols-3">
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
              {locale === "en" ? "Symbol / setup" : "Simbol / setup"}
            </h3>
            <EdgeTable
              rows={report.edge.symbols}
              formatOpts={formatOpts}
              empty={locale === "en" ? "Need 3+ closes per bucket." : "Butuh 3+ close per bucket."}
            />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
              {locale === "en" ? "Session" : "Sesi"}
            </h3>
            <EdgeTable
              rows={report.edge.sessions}
              formatOpts={formatOpts}
              empty={locale === "en" ? "Log more session-tagged trades." : "Log lebih banyak trade per sesi."}
            />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
              {locale === "en" ? "Asset class" : "Kelas aset"}
            </h3>
            <EdgeTable
              rows={report.edge.assets}
              formatOpts={formatOpts}
              empty={locale === "en" ? "Need 3+ closes per asset." : "Butuh 3+ close per aset."}
            />
          </div>
        </div>
      </AnalyticsSection>

      <AnalyticsSection
        title={sectionTitles.losses}
        hint={
          locale === "en"
            ? "Dominated patterns to remove from your policy."
            : "Pola dominasi yang sebaiknya dihapus dari kebijakanmu."
        }
      >
        {report.leakage.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {locale === "en"
              ? "No dominated patterns yet (revenge, clusters, rule breaks)."
              : "Belum ada pola dominasi (revenge, cluster, pelanggaran aturan)."}
          </p>
        ) : (
          <div className="space-y-3">
            {report.leakage.map((l) => (
              <article
                key={l.id}
                className={cn(
                  "rounded-lg border px-4 py-3",
                  l.severity === "high" ? "note-surface-down border" : "border-zinc-800/80"
                )}
              >
                <h3 className="font-medium text-zinc-100">{l.title[locale]}</h3>
                <p className="mt-1 text-sm text-zinc-400">{l.detail[locale]}</p>
              </article>
            ))}
          </div>
        )}
      </AnalyticsSection>

      <AnalyticsSection
        title={sectionTitles.context}
        hint={locale === "en" ? "When to trade vs stay flat." : "Kapan trade vs stay flat."}
      >
        {report.context.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {locale === "en" ? "Context matrix needs more journal closes." : "Matrix konteks butuh lebih banyak close di Journal."}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {report.context.map((c) => (
              <div key={c.key} className={cn("rounded-lg border px-4 py-3", ZONE_CLASS[c.zone])}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{c.label[locale]}</span>
                  <span className="text-xs uppercase tracking-wide opacity-80">{ZONE_LABEL[c.zone][locale]}</span>
                </div>
                <p className="mt-2 tabular-nums text-sm opacity-90">
                  {formatPnl(c.net, formatOpts)} · {c.count} close
                  {c.winRate != null ? ` · ${Math.round(c.winRate * 100)}% W` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </AnalyticsSection>

      <AnalyticsSection
        title={sectionTitles.behavior}
        hint={
          locale === "en"
            ? `Last 7d vs prior 7d · ${report.sampleClosed} closes total`
            : `7 hari vs 7 hari sebelumnya · ${report.sampleClosed} close total`
        }
      >
        {report.drift.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {locale === "en" ? "Need activity in both windows." : "Butuh aktivitas di kedua window."}
          </p>
        ) : (
          <div className="space-y-2">
            {report.drift.map((d) => (
              <div
                key={d.metric.en}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800/80 px-4 py-3 text-sm"
              >
                <span className="text-zinc-300">{d.metric[locale]}</span>
                <span className="tabular-nums text-zinc-400">
                  {d.prior} → {d.recent}{" "}
                  <span
                    className={
                      d.direction === "better"
                        ? "note-pnl-up"
                        : d.direction === "worse"
                          ? "note-pnl-down"
                          : "text-zinc-400"
                    }
                  >
                    {d.direction === "better" ? "↑" : d.direction === "worse" ? "↓" : "→"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </AnalyticsSection>

      <AnalyticsSection
        title={sectionTitles.suggestions}
        hint={
          locale === "en"
            ? "Proposed constraint updates - apply explicitly to Playbook."
            : "Usulan update constraint - apply eksplisit ke Playbook."
        }
      >
        {report.suggestions.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {locale === "en" ? "No rule changes suggested yet." : "Belum ada usulan perubahan aturan."}
          </p>
        ) : (
          <div className="space-y-3">
            {report.suggestions.map((s) => (
              <article key={s.id} className="rounded-lg border border-zinc-800/80 px-4 py-3">
                <h3 className="font-medium text-zinc-100">{s.title[locale]}</h3>
                <p className="mt-1 text-sm text-zinc-400">{s.detail[locale]}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applySuggestion(s.id)}
                    className="inline-flex min-h-11 items-center rounded-md bg-zinc-100 px-3 text-sm font-medium text-zinc-900 hover:bg-white"
                  >
                    {appliedId === s.id
                      ? locale === "en"
                        ? "Applied"
                        : "Sudah diterapkan"
                      : locale === "en"
                        ? "Apply to Playbook"
                        : "Terapkan ke Playbook"}
                  </button>
                  <Link
                    href="/note/playbook"
                    className="inline-flex min-h-11 items-center rounded-md border border-zinc-700 px-3 text-sm text-zinc-300 hover:border-zinc-500"
                  >
                    {locale === "en" ? "Open Playbook" : "Buka Playbook"}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </AnalyticsSection>
    </div>
  );
}

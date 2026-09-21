"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { NoteOverviewChartControls } from "@/components/note/note-overview-chart-controls";
import {
  defaultOverviewChartPrefs,
  loadOverviewChartPrefs,
  saveOverviewChartPrefs,
  type OverviewChartPrefs,
} from "@/lib/note/overview-chart-prefs";

import { NoteLoadingLine } from "@/components/note/note-loading-line";
import { useNoteJournal } from "@/components/note/note-journal-context";
import { NOTE_EXECUTION_KIND } from "@/lib/note/sections";
import DailyReturnsCalendar from "@/components/ui/daily-returns-calendar";
import { NoteOverviewPortfolioChart } from "@/components/note/note-overview-portfolio-chart";
import { NotePnlStackedAreaChart } from "@/components/ui/note-pnl-stacked-area-chart";
import { NotePnlTradeScatterChart } from "@/components/ui/note-pnl-trade-scatter-chart";
import { noteCopy } from "@/lib/note/copy";
import { noteApexLoginHref } from "@/lib/note/sso-urls";
import { jakartaDateKey } from "@/lib/note/economic-calendar/date-range";
import { fxContextFromPrefs } from "@/lib/note/fx/context";
import { pnlOptsForSlot, pnlOptsFromPrefs } from "@/lib/note/prefs";
import {
  dailyReturnPct,
  alignedCumulativeSeries,
  pnlStackPoints,
  filterEntries,
  formatPnl,
  monthBuckets,
  returnsNotionalFromEntries,
  summarizeJournal,
} from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

export function NoteOverview() {
  const router = useRouter();
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const formatOpts = pnlOptsFromPrefs(prefs);
  const fx = useMemo(() => fxContextFromPrefs(prefs), [prefs]);
  const kind = NOTE_EXECUTION_KIND;
  const journal = useNoteJournal();
  const today = jakartaDateKey();
  const [cursor, setCursor] = useState(() => {
    const [year, month] = today.split("-").map(Number);
    return { year, month: month - 1 };
  });
  const [chartPrefs, setChartPrefs] = useState<OverviewChartPrefs>(defaultOverviewChartPrefs);

  useEffect(() => {
    setChartPrefs(loadOverviewChartPrefs());
  }, []);

  const kindScoped = useMemo(
    () => filterEntries(journal.data?.entries ?? [], { kind, result: "ALL" }),
    [journal.data, kind]
  );
  const heroEntries = useMemo(
    () => kindScoped.filter((e) => isPnlKind(e.kind)),
    [kindScoped]
  );
  const snapshot = useMemo(() => summarizeJournal(heroEntries, fx), [heroEntries, fx]);
  const chartStack = useMemo(
    () =>
      pnlStackPoints(heroEntries, {
        granularity: chartPrefs.granularity,
        from: chartPrefs.range.from,
        to: chartPrefs.range.to,
        hideEmptyDays: chartPrefs.hideEmptyDays,
        fx,
      }),
    [heroEntries, chartPrefs, fx]
  );
  const notional = useMemo(() => returnsNotionalFromEntries(heroEntries), [heroEntries]);
  const buckets = useMemo(
    () => monthBuckets(kindScoped, cursor.year, cursor.month, fx),
    [kindScoped, cursor, fx]
  );
  const returnPctByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of buckets) {
      map.set(b.date, dailyReturnPct(b.pnl, notional));
    }
    return map;
  }, [buckets, notional]);

  const chartRange = chartPrefs.range;

  const resultsEquity = useMemo(
    () =>
      alignedCumulativeSeries(heroEntries, {
        granularity: chartPrefs.granularity,
        from: chartRange.from,
        to: chartRange.to,
        hideEmptyDays: chartPrefs.hideEmptyDays,
        fx,
      }),
    [heroEntries, chartRange, chartPrefs.granularity, chartPrefs.hideEmptyDays, fx]
  );

  const monthBounds = useMemo(() => {
    const prefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
    const lastDay = new Date(cursor.year, cursor.month + 1, 0).getDate();
    return {
      from: `${prefix}-01`,
      to: `${prefix}-${String(lastDay).padStart(2, "0")}`,
    };
  }, [cursor.year, cursor.month]);

  const monthSnapshot = useMemo(
    () =>
      summarizeJournal(
        filterEntries(heroEntries, {
          kind: "ALL",
          result: "ALL",
          dateFrom: monthBounds.from,
          dateTo: monthBounds.to,
        }),
        fx
      ),
    [heroEntries, monthBounds, fx]
  );

  const rangeSnapshot = useMemo(
    () =>
      summarizeJournal(
        filterEntries(heroEntries, {
          kind: "ALL",
          result: "ALL",
          dateFrom: chartRange.from,
          dateTo: chartRange.to,
        }),
        fx
      ),
    [heroEntries, chartRange, fx]
  );

  if (journal.error) {
    return <p className="note-pnl-down text-sm">{journal.error}</p>;
  }
  if (journal.loading || !journal.data) {
    return <NoteLoadingLine journal />;
  }

  const headline =
    prefs.locale === "en"
      ? snapshot.pnlSum >= 0
        ? "You're green. Stay disciplined."
        : "Red window. Protect capital first."
      : snapshot.pnlSum >= 0
        ? "Lagi hijau. Jaga disiplin."
        : "Lagi merah. Prioritaskan proteksi modal.";

  const cellOpts = pnlOptsForSlot(prefs, "calendar");
  const chartFmtOpts = pnlOptsForSlot(prefs, "chart");

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {journal.demo && !journal.openAccess ? (
        <p className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-3 py-2 text-xs text-zinc-400">
          {copy.contoh}{" "}
          <Link href={noteApexLoginHref("/note")} className="text-zinc-200 hover:underline">
            {copy.masuk}
          </Link>
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-start">
        <div className="flex flex-col gap-5">
          <section className="rounded-xl border border-zinc-800/70 p-4 sm:p-5">
            <h2 className="mb-3 text-lg font-semibold tracking-tight text-zinc-100">
              {prefs.locale === "en" ? "This month" : "Bulan ini"}
            </h2>
            <DailyReturnsCalendar
              variant="hero"
              year={cursor.year}
              monthIndex={cursor.month}
              buckets={buckets}
              returnPctByDate={returnPctByDate}
              selectedDate={null}
              today={today}
              weekStart={prefs.weekStart}
              locale={prefs.locale}
              formatDayPnl={(pnl) => formatPnl(pnl, cellOpts)}
              headerIdle={
                <>
                  <span
                    className={cn(
                      "font-medium",
                      monthSnapshot.pnlSum >= 0 ? "note-pnl-up" : "note-pnl-down"
                    )}
                  >
                    {formatPnl(monthSnapshot.pnlSum, cellOpts)}
                  </span>
                  <span className="mx-1.5 text-zinc-500">·</span>
                  <span className="font-medium text-zinc-100">
                    {monthSnapshot.winRate == null
                      ? "-"
                      : `${Math.round(monthSnapshot.winRate * 100)}%`}
                    <span className="font-normal text-zinc-400">
                      ({monthSnapshot.closedCount})
                    </span>
                  </span>
                </>
              }
              onSelect={(date) => {
                router.push(`/note/jurnal?date=${date}`);
              }}
              onPrev={() =>
                setCursor((c) =>
                  c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }
                )
              }
              onNext={() =>
                setCursor((c) =>
                  c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }
                )
              }
            />
          </section>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/note/baru"
              className="inline-flex min-h-11 items-center rounded-md bg-zinc-100 px-4 text-sm font-semibold text-zinc-950 hover:bg-white"
            >
              + {copy.logTrade}
            </Link>
            <Link
              href="/note/jurnal"
              className="inline-flex min-h-11 items-center rounded-md border border-zinc-700 px-4 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              {prefs.locale === "en" ? "Open journal" : "Buka jurnal"}
            </Link>
          </div>
        </div>

        <section className="rounded-xl border border-zinc-800/70 p-4 sm:p-5">
          <h2 className="mb-1 text-lg font-semibold tracking-tight text-zinc-100">
            {prefs.locale === "en" ? "Chart range" : "Rentang chart"}
          </h2>
          <p className="mb-3 font-heading text-base font-semibold tracking-tight text-zinc-200 sm:text-lg">
            {headline}
          </p>
          <div className="mb-4 grid grid-cols-3 gap-3 sm:gap-4">
            <div>
              <p className="text-xs text-zinc-400">{prefs.locale === "en" ? "PnL" : "PnL"}</p>
              <p
                className={cn(
                  "font-heading text-xl tabular-nums tracking-tight sm:text-2xl",
                  rangeSnapshot.pnlSum >= 0 ? "note-pnl-up" : "note-pnl-down"
                )}
              >
                {formatPnl(rangeSnapshot.pnlSum, formatOpts)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">
                {prefs.locale === "en" ? "Win rate" : "Win rate"}
              </p>
              <p className="font-heading text-xl tabular-nums tracking-tight text-zinc-100 sm:text-2xl">
                {rangeSnapshot.winRate == null
                  ? "-"
                  : `${Math.round(rangeSnapshot.winRate * 100)}%`}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">
                {prefs.locale === "en" ? "Trades" : "Trade"}
              </p>
              <p className="font-heading text-xl tabular-nums tracking-tight text-zinc-100 sm:text-2xl">
                {rangeSnapshot.closedCount}
              </p>
            </div>
          </div>
          <div className="mb-4">
            <NoteOverviewChartControls
              value={chartPrefs}
              onChange={(next) => {
                setChartPrefs(next);
                saveOverviewChartPrefs(next);
              }}
            />
          </div>
          <div className="flex flex-col gap-6">
            <div className="min-w-0 space-y-2">
              <p className="text-xs font-medium text-zinc-400">
                {prefs.locale === "en" ? "PnL · wins / losses / net" : "PnL · menang / rugi / net"}
              </p>
              {chartPrefs.granularity === "trade" ? (
                <NotePnlTradeScatterChart
                  data={chartStack}
                  locale={prefs.locale}
                  formatValue={(n) => formatPnl(n, chartFmtOpts)}
                />
              ) : (
                <NotePnlStackedAreaChart
                  data={chartStack}
                  locale={prefs.locale}
                  formatValue={(n) => formatPnl(n, chartFmtOpts)}
                />
              )}
            </div>
            <div className="min-w-0">
              <NoteOverviewPortfolioChart
                points={resultsEquity}
                locale={prefs.locale}
                granularity={chartPrefs.granularity}
                formatValue={(n) => formatPnl(n, chartFmtOpts)}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

import { formatPnl, pnlTone, type ColorMode, type FormatPnlOpts, type JournalSnapshot } from "@/lib/note/stats";
import { NoteTip } from "@/components/note/note-tip";

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const min = Math.min(0, ...points);
  const max = Math.max(0, ...points);
  const span = max - min || 1;
  const w = 120;
  const h = 36;
  const d = points
    .map((value, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((value - min) / span) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const y0 = h - ((0 - min) / span) * h;
  const last = points[points.length - 1] ?? 0;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-[7.5rem]" aria-hidden>
      <line x1="0" x2={w} y1={y0} y2={y0} stroke="#3f3f46" strokeWidth="1" />
      <path d={d} fill="none" stroke={last >= 0 ? "#34d399" : "#fb7185"} strokeWidth="1.5" />
    </svg>
  );
}

function Metric({
  label,
  tip,
  children,
}: {
  label: string;
  tip: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[11px] text-zinc-500">
        <NoteTip text={tip} side="bottom">
          {label}
        </NoteTip>
      </p>
      <div className="cursor-default tabular-nums">{children}</div>
    </div>
  );
}

export function NoteStatsStrip({
  snapshot,
  equity,
  updatedLabel,
  colorMode,
  formatOpts,
  labels,
}: {
  snapshot: JournalSnapshot;
  equity: number[];
  updatedLabel: string | null;
  colorMode: ColorMode;
  formatOpts: FormatPnlOpts;
  labels: { net: string; win: string; entry: string; kurva: string; expectansi: string; diperbarui: string };
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-wrap items-end gap-6">
          <Metric label={labels.net} tip="Jumlah PnL pada rentang hero (bukan hari yang diklik).">
            <p
              className={`font-heading text-3xl tracking-tight sm:text-4xl ${pnlTone(snapshot.pnlSum, colorMode)}`}
            >
              {formatPnl(snapshot.pnlSum, formatOpts)}
            </p>
          </Metric>
          <Metric label={labels.kurva} tip="Kumulatif jurnal. Bukan ekuitas akun broker.">
            <Sparkline points={equity} />
          </Metric>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <Metric label={labels.entry} tip="Jumlah entry pada rentang hero.">
            <span className="text-zinc-200">{snapshot.tradeCount}</span>
          </Metric>
          <Metric label={labels.expectansi} tip="Rata-rata PnL entry tertutup.">
            <span className={pnlTone(snapshot.expectancy ?? 0, colorMode)}>
              {formatPnl(snapshot.expectancy, { ...formatOpts, decimals: Math.max(formatOpts.decimals ?? 0, 2) })}
            </span>
          </Metric>
          <Metric label={labels.win} tip="Win rate entry tertutup. Tanpa R-multiple. Bukan ranking.">
            <span className="text-zinc-200">
              {snapshot.winRate == null ? "—" : `${Math.round(snapshot.winRate * 100)}%`}
            </span>
          </Metric>
        </div>
      </div>
      {updatedLabel ? (
        <p className="text-[11px] text-zinc-600">
          {labels.diperbarui} {updatedLabel}
        </p>
      ) : null}
    </div>
  );
}

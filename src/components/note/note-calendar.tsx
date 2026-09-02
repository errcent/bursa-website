import { cn } from "@/lib/utils";
import {
  formatPnl,
  pnlTone,
  weekPad,
  weekdayLabels,
  type ColorMode,
  type DayBucket,
  type FormatPnlOpts,
  type WeekStart,
} from "@/lib/note/stats";

function heatClass(pnl: number, maxAbs: number, count: number, colorMode: ColorMode) {
  if (count === 0) return "text-zinc-500 hover:bg-zinc-900";
  if (colorMode === "pattern") {
    if (pnl < 0) return "bg-zinc-900 text-zinc-100";
    if (pnl > 0) return "bg-zinc-800 text-zinc-50";
    return "bg-zinc-900/80 text-zinc-300";
  }
  const intensity = maxAbs === 0 ? 0.35 : Math.min(1, Math.abs(pnl) / maxAbs);
  if (pnl > 0) {
    if (intensity > 0.66) return "bg-emerald-500/35 text-emerald-50";
    if (intensity > 0.33) return "bg-emerald-500/20 text-emerald-100";
    return "bg-emerald-500/10 text-emerald-200";
  }
  if (pnl < 0) {
    if (intensity > 0.66) return "bg-rose-500/35 text-rose-50";
    if (intensity > 0.33) return "bg-rose-500/20 text-rose-100";
    return "bg-rose-500/10 text-rose-200";
  }
  return "bg-zinc-800 text-zinc-300";
}

export function NoteCalendar({
  year,
  monthIndex,
  buckets,
  selectedDate,
  today,
  weekStart,
  showNet,
  density,
  colorMode,
  formatOpts,
  onSelect,
  onPrev,
  onNext,
}: {
  year: number;
  monthIndex: number;
  buckets: DayBucket[];
  selectedDate: string | null;
  today: string;
  weekStart: WeekStart;
  showNet: boolean;
  density: "comfortable" | "compact";
  colorMode: ColorMode;
  formatOpts: FormatPnlOpts;
  onSelect: (date: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const label = new Date(year, monthIndex, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
  const maxAbs = Math.max(1, ...buckets.map((b) => Math.abs(b.pnl)));
  const lead = buckets[0] ? weekPad(buckets[0].date, weekStart) : 0;
  const cells: Array<DayBucket | null> = [...Array(lead).fill(null), ...buckets];
  while (cells.length % 7 !== 0) cells.push(null);
  const headers = weekdayLabels(weekStart);
  const minH = density === "compact" ? "min-h-[3rem] sm:min-h-[4rem]" : "min-h-[3.75rem] sm:min-h-[5rem]";

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className="rounded px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          aria-label="Bulan sebelumnya"
          onClick={onPrev}
        >
          ‹
        </button>
        <h2 className="text-sm font-medium capitalize text-zinc-200">{label}</h2>
        <button
          type="button"
          className="rounded px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          aria-label="Bulan berikutnya"
          onClick={onNext}
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-zinc-500">
        {headers.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((bucket, i) => {
          if (!bucket) return <div key={`pad-${i}`} />;
          const day = Number(bucket.date.slice(-2));
          const selected = selectedDate === bucket.date;
          const isToday = today === bucket.date;
          return (
            <button
              key={bucket.date}
              type="button"
              aria-pressed={selected}
              aria-current={isToday ? "date" : undefined}
              onClick={() => onSelect(bucket.date)}
              className={cn(
                "flex flex-col items-start justify-between rounded-md p-1.5 text-left hover:bg-zinc-900 sm:p-2",
                minH,
                heatClass(bucket.pnl, maxAbs, bucket.count, colorMode),
                isToday && !selected ? "ring-1 ring-zinc-400" : "",
                selected ? "ring-2 ring-zinc-100" : ""
              )}
            >
              <span className="text-[11px] tabular-nums text-zinc-300">{day}</span>
              {showNet && bucket.count > 0 ? (
                <span className="w-full">
                  <span className={`block text-[10px] tabular-nums sm:text-xs ${pnlTone(bucket.pnl, colorMode)}`}>
                    {formatPnl(bucket.pnl, formatOpts)}
                  </span>
                  <span className="text-[10px] text-zinc-500">{bucket.count}</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

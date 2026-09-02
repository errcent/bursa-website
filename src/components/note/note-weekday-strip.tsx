import {
  formatPnl,
  pnlTone,
  weekdayLabels,
  weekdayOrder,
  type ColorMode,
  type FormatPnlOpts,
  type WeekStart,
  type WeekdayNet,
} from "@/lib/note/stats";

export function NoteWeekdayStrip({
  nets,
  weekStart,
  colorMode,
  formatOpts,
  compact = false,
}: {
  nets: WeekdayNet[];
  weekStart: WeekStart;
  colorMode: ColorMode;
  formatOpts: FormatPnlOpts;
  compact?: boolean;
}) {
  const labels = weekdayLabels(weekStart);
  const order = weekdayOrder(weekStart);
  const maxAbs = Math.max(1, ...nets.map((n) => Math.abs(n.net)));

  return (
    <div className="grid grid-cols-7 gap-0.5" aria-hidden={false}>
      {order.map((weekday, i) => {
        const cell = nets[weekday];
        const ratio = Math.abs(cell.net) / maxAbs;
        const h = cell.count === 0 ? 3 : compact ? 6 + Math.round(ratio * 14) : 8 + Math.round(ratio * 24);
        return (
          <div key={weekday} className="flex cursor-default flex-col items-center gap-1">
            <span
              className={`w-full max-w-[1.35rem] rounded-sm ${
                cell.net > 0 && colorMode === "hue"
                  ? "bg-emerald-500/50"
                  : cell.net < 0 && colorMode === "hue"
                    ? "bg-rose-500/50"
                    : "bg-zinc-800"
              }`}
              style={{ height: h }}
              aria-hidden
            />
            <span className="text-[10px] text-zinc-500">{labels[i]}</span>
            <span className={`text-[10px] tabular-nums ${pnlTone(cell.net, colorMode)}`}>
              {cell.count ? formatPnl(cell.net, formatOpts) : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

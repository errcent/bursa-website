import { formatPct, formatPnl, pnlTone, type ColorMode, type FormatPnlOpts, type SliceStat } from "@/lib/note/stats";
import { NoteTip } from "@/components/note/note-tip";

function Column({
  title,
  rows,
  colorMode,
  formatOpts,
}: {
  title: string;
  rows: SliceStat[];
  colorMode: ColorMode;
  formatOpts: FormatPnlOpts;
}) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] text-zinc-500">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-600">—</p>
      ) : (
        <ul className="space-y-1">
          {rows.slice(0, 8).map((row) => (
            <li key={row.key} className="cursor-default">
              <NoteTip text={`${row.count} entry · ${formatPct(row.winRate)}`}>
                <div className="flex items-baseline justify-between gap-4 text-xs">
                  <span className="truncate text-zinc-400">{row.key}</span>
                  <span className={`tabular-nums ${pnlTone(row.net, colorMode)}`}>
                    {formatPnl(row.net, formatOpts)}
                  </span>
                </div>
              </NoteTip>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function NoteBreakdown({
  symbols,
  emotions,
  colorMode,
  formatOpts,
  scopeLabel,
}: {
  symbols: SliceStat[];
  emotions: SliceStat[];
  colorMode: ColorMode;
  formatOpts: FormatPnlOpts;
  scopeLabel?: string;
}) {
  if (symbols.length === 0 && emotions.length === 0) return null;
  return (
    <div className="space-y-3">
      {scopeLabel ? <p className="text-[11px] text-zinc-600">{scopeLabel}</p> : null}
      <div className="grid gap-8 sm:grid-cols-2">
        <Column title="Simbol" rows={symbols} colorMode={colorMode} formatOpts={formatOpts} />
        <Column title="Emosi" rows={emotions} colorMode={colorMode} formatOpts={formatOpts} />
      </div>
    </div>
  );
}

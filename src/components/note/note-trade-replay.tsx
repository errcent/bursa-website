"use client";

import { useState } from "react";

import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

interface ReplayPayload {
  markers: { entry: { t: string; price: number }; exit: { price: number } | null } | null;
  mae: number | null;
  mfe: number | null;
  path: { t: number; equity: number }[];
  candlesUsed: number;
  honesty: string[];
  cached?: boolean;
}

const HONESTY_COPY: Record<string, { id: string; en: string }> = {
  estimated: { id: "Estimasi dari candle observasi", en: "Estimated from observed candles" },
  "ex-fees-fx": { id: "Di luar fee & kurs", en: "Excludes fees & FX" },
  truncated: { id: "Riwayat terpotong", en: "History truncated" },
  "withheld:low-coverage": { id: "Ditahan: cakupan rendah", en: "Withheld: low coverage" },
  "withheld:gappy": { id: "Ditahan: gap dominan", en: "Withheld: gap-dominated" },
  "withheld:missing-entry": { id: "Butuh harga entry", en: "Needs entry price" },
  "withheld:bad-window": { id: "Jendela waktu invalid", en: "Invalid window" },
};

function Sparkline({ path }: { path: { t: number; equity: number }[] }) {
  if (path.length < 2) return null;
  const W = 220;
  const H = 48;
  const equities = path.map((p) => p.equity);
  const min = Math.min(0, ...equities);
  const max = Math.max(0, ...equities);
  const span = max - min || 1;
  const pts = path
    .map((p, i) => {
      const x = (i / (path.length - 1)) * W;
      const y = H - 4 - ((p.equity - min) / span) * (H - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const zeroY = H - 4 - ((0 - min) / span) * (H - 8);
  const up = (path[path.length - 1]?.equity ?? 0) >= 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-12 w-full" role="img" aria-label="Equity path">
      <line x1={0} y1={zeroY} x2={W} y2={zeroY} className="stroke-zinc-700" strokeWidth={1} strokeDasharray="3 3" />
      <polyline points={pts} fill="none" className={up ? "stroke-emerald-400" : "stroke-rose-400"} strokeWidth={1.5} />
    </svg>
  );
}

/** Per-trade replay expander: markers + MAE/MFE + honesty labels. */
export function NoteTradeReplay({ entryId, symbol }: { entryId: string; symbol: string }) {
  const [prefs] = useNotePrefs();
  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ReplayPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (data || loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/note/replay?entryId=${encodeURIComponent(entryId)}`, { credentials: "include" });
      const json = (await res.json().catch(() => null)) as ReplayPayload | null;
      if (!res.ok || !json) setFailed(true);
      else setData(json);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => void toggle()}
        aria-expanded={open}
        className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md border border-zinc-700 px-3 text-xs text-zinc-200 hover:bg-zinc-800"
      >
        {t("Replay", "Replay")} · {symbol}
      </button>
      {open ? (
        <div className="mt-2 rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
          {loading ? (
            <p className="text-xs text-zinc-400">{t("Memuat candle…", "Loading candles…")}</p>
          ) : failed || !data ? (
            <p className="text-xs text-zinc-400">{t("Replay tidak tersedia.", "Replay unavailable.")}</p>
          ) : (
            <div className="space-y-2">
              {data.markers ? (
                <p className="text-xs tabular-nums text-zinc-300">
                  {t("Masuk", "In")} {data.markers.entry.price}
                  {data.markers.exit ? ` → ${t("keluar", "out")} ${data.markers.exit.price}` : ""}
                </p>
              ) : null}
              <Sparkline path={data.path} />
              <div className="flex gap-4 text-xs tabular-nums">
                <span className="text-zinc-400">
                  MAE <span className="text-rose-300">{data.mae == null ? "-" : data.mae.toFixed(0)}</span>
                </span>
                <span className="text-zinc-400">
                  MFE <span className="text-emerald-300">{data.mfe == null ? "-" : data.mfe.toFixed(0)}</span>
                </span>
                <span className="text-zinc-500">{data.candlesUsed} candle</span>
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {data.honesty.map((h) => {
                  const [key, param] = h.split(":");
                  const label = HONESTY_COPY[h] ?? HONESTY_COPY[key!] ?? { id: h, en: h };
                  return (
                    <li
                      key={h}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px]",
                        h.startsWith("withheld") ? "border-amber-800/60 text-amber-300" : "border-zinc-800 text-zinc-400",
                      )}
                    >
                      {label[prefs.locale]}
                      {param && !HONESTY_COPY[h] ? ` ${param}` : ""}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

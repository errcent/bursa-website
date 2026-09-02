"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { noteCopy } from "@/lib/note/copy";
import { noteSsoStartHref } from "@/lib/note/sso-urls";
import type { JournalKind } from "@/lib/note/types";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

const EMOTIONS = ["", "tenang", "yakin", "cemas", "marah", "FOMO", "lega", "malu"] as const;

const inputClass =
  "mt-1 h-10 w-full border-0 border-b border-zinc-800 bg-transparent px-0 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-zinc-500";

const labelClass = "block text-[11px] text-zinc-500";

export function NoteEntryForm({ initialDate }: { initialDate?: string | null }) {
  const router = useRouter();
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const [kind, setKind] = useState<JournalKind>(prefs.defaultKind);
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState("BUY");
  const [pnl, setPnl] = useState("");
  const [openedDate, setOpenedDate] = useState(initialDate ?? "");
  const [emotion, setEmotion] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setKind(prefs.defaultKind);
  }, [prefs.defaultKind]);

  const pnlNumber = pnl === "" ? null : Number(pnl);
  const showLossEmotionHint =
    prefs.emotionPrompt === "after-loss" && pnlNumber != null && pnlNumber < 0 && !emotion;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/note/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        mode: "cepat",
        symbol,
        side,
        pnl: pnlNumber,
        emotion: emotion || null,
        note: note.trim() || null,
        openedAt: openedDate ? `${openedDate}T12:00:00+07:00` : null,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setPending(false);
    if (res.status === 401) {
      window.location.href = noteSsoStartHref("/note/baru");
      return;
    }
    if (!res.ok) {
      setError(body.error ?? "Gagal menyimpan.");
      return;
    }
    router.push("/note");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-8">
      <div>
        <p className={labelClass}>Jenis</p>
        <div className="mt-2 flex gap-3 text-sm">
          <button
            type="button"
            onClick={() => setKind("TRADE")}
            className={kind === "TRADE" ? "font-medium text-zinc-100 underline decoration-zinc-500 underline-offset-4" : "text-zinc-500 hover:text-zinc-300"}
          >
            Trade
          </button>
          <button
            type="button"
            onClick={() => setKind("INVEST")}
            className={kind === "INVEST" ? "font-medium text-zinc-100 underline decoration-zinc-500 underline-offset-4" : "text-zinc-500 hover:text-zinc-300"}
          >
            Invest
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-6">
        <label className="col-span-2">
          <span className={labelClass}>Simbol</span>
          <input
            required
            className={inputClass}
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            aria-label="Simbol"
          />
        </label>
        <label>
          <span className={labelClass}>Sisi</span>
          <select className={inputClass} value={side} onChange={(e) => setSide(e.target.value)} aria-label="Sisi">
            <option value="BUY">Buy</option>
            <option value="SELL">Sell</option>
            <option value="HOLD">Hold</option>
            <option value="DCA">DCA</option>
          </select>
        </label>
        <label>
          <span className={labelClass}>PnL</span>
          <input
            type="number"
            step="any"
            className={inputClass}
            value={pnl}
            onChange={(e) => setPnl(e.target.value)}
            aria-label="PnL"
          />
        </label>
        <label>
          <span className={labelClass}>Tanggal</span>
          <input
            type="date"
            className={`${inputClass} text-zinc-300`}
            value={openedDate}
            onChange={(e) => setOpenedDate(e.target.value)}
            aria-label="Tanggal"
          />
        </label>
        <label>
          <span className={labelClass}>Emosi (opsional)</span>
          <select
            className={inputClass}
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
            aria-label="Emosi"
          >
            <option value="">—</option>
            {EMOTIONS.filter(Boolean).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {showLossEmotionHint ? (
            <p className="mt-1 text-[11px] text-zinc-500">Setelah rugi, satu kata membantu. Boleh dikosongkan.</p>
          ) : null}
        </label>
        <label className="col-span-2">
          <span className={labelClass}>Catatan (opsional)</span>
          <textarea
            rows={2}
            className={`${inputClass} resize-none py-2`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-label="Catatan"
          />
        </label>
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <div className="flex items-center justify-between">
        <button type="button" className="text-sm text-zinc-500 hover:text-zinc-200" onClick={() => router.push("/note")}>
          {copy.batal}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {pending ? copy.menyimpan : copy.simpan}
        </button>
      </div>
    </form>
  );
}

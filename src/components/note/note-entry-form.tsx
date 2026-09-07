"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { isProductionHostRouting, originFor } from "@/lib/hosts/hosts";
import { noteCopy } from "@/lib/note/copy";
import { noteSsoStartHref } from "@/lib/note/sso-urls";
import type { JournalKind, JournalMode } from "@/lib/note/types";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

const EMOTIONS = ["", "tenang", "yakin", "cemas", "marah", "FOMO", "lega", "malu"] as const;

const inputClass =
  "mt-1 h-10 w-full rounded-md border border-zinc-800 bg-zinc-900/40 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-600";

const labelClass = "block text-[11px] font-medium uppercase tracking-wide text-zinc-500";

export function NoteEntryForm({ initialDate }: { initialDate?: string | null }) {
  const router = useRouter();
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const catalogBase = isProductionHostRouting() ? originFor("apex") : "";

  const [kind, setKind] = useState<JournalKind>(prefs.defaultKind);
  const [mode, setMode] = useState<JournalMode>("cepat");
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState("BUY");
  const [pnl, setPnl] = useState("");
  const [openedDate, setOpenedDate] = useState(initialDate ?? "");
  const [emotion, setEmotion] = useState("");
  const [note, setNote] = useState("");
  const [ruleBroken, setRuleBroken] = useState("");
  const [lesson, setLesson] = useState("");
  const [relatedCourseSlug, setRelatedCourseSlug] = useState("");
  const [relatedLessonId, setRelatedLessonId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (prefs.defaultKind !== "REFLEKSI") setKind(prefs.defaultKind);
  }, [prefs.defaultKind]);

  const pnlNumber = pnl === "" ? null : Number(pnl);
  const isRefleksi = kind === "REFLEKSI";
  const showLossEmotionHint =
    !isRefleksi &&
    prefs.emotionPrompt === "after-loss" &&
    pnlNumber != null &&
    pnlNumber < 0 &&
    !emotion;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/note/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        mode: isRefleksi ? "cepat" : mode,
        symbol: isRefleksi ? relatedCourseSlug || "Refleksi" : symbol,
        side: isRefleksi ? "NOTE" : side,
        pnl: isRefleksi ? null : pnlNumber,
        emotion: emotion || null,
        note: note.trim() || null,
        ruleBroken: mode === "review" && !isRefleksi ? ruleBroken.trim() || null : null,
        lesson: mode === "review" && !isRefleksi ? lesson.trim() || null : null,
        relatedCourseSlug: relatedCourseSlug.trim() || null,
        relatedLessonId: relatedLessonId.trim() || null,
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
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-8">
      <div>
        <p className={labelClass}>{copy.jenis}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          {(
            [
              ["TRADE", copy.trade],
              ["INVEST", copy.invest],
              ["REFLEKSI", copy.refleksi],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setKind(value)}
              className={cn(
                "rounded-md border px-3 py-1.5 transition-colors",
                kind === value
                  ? "border-zinc-500 bg-zinc-900 text-zinc-100"
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!isRefleksi ? (
        <div>
          <p className={labelClass}>{copy.modeEntry}</p>
          <div className="mt-2 flex gap-2">
            {(
              [
                ["cepat", copy.modeCepat],
                ["review", copy.modeReview],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm",
                  mode === value ? "bg-zinc-100 font-medium text-zinc-950" : "text-zinc-500 hover:text-zinc-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        {!isRefleksi ? (
          <>
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
          </>
        ) : null}

        <label className={isRefleksi ? "col-span-2" : undefined}>
          <span className={labelClass}>Tanggal</span>
          <input
            type="date"
            className={inputClass}
            value={openedDate}
            onChange={(e) => setOpenedDate(e.target.value)}
            aria-label="Tanggal"
          />
        </label>

        <label className={isRefleksi ? "col-span-2" : undefined}>
          <span className={labelClass}>Emosi (opsional)</span>
          <select className={inputClass} value={emotion} onChange={(e) => setEmotion(e.target.value)} aria-label="Emosi">
            <option value="">-</option>
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
          <span className={labelClass}>{copy.linkKelas}</span>
          <input
            className={inputClass}
            value={relatedCourseSlug}
            onChange={(e) => setRelatedCourseSlug(e.target.value)}
            placeholder="slug-kelas (opsional)"
            aria-label={copy.linkKelas}
          />
          {relatedCourseSlug.trim() ? (
            <a
              href={`${catalogBase}/kelas/${relatedCourseSlug.trim()}`}
              className="mt-1 inline-block text-xs text-zinc-400 hover:text-zinc-200"
              target="_blank"
              rel="noreferrer"
            >
              {copy.lihatKelas}
            </a>
          ) : null}
        </label>

        <label className="col-span-2">
          <span className={labelClass}>ID pelajaran (opsional)</span>
          <input
            className={inputClass}
            value={relatedLessonId}
            onChange={(e) => setRelatedLessonId(e.target.value)}
            placeholder="lesson-id"
            aria-label="ID pelajaran"
          />
        </label>

        <label className="col-span-2">
          <span className={labelClass}>{isRefleksi ? copy.catatanRefleksi : "Catatan (opsional)"}</span>
          <textarea
            rows={isRefleksi ? 4 : 2}
            required={isRefleksi}
            className={`${inputClass} min-h-[4.5rem] resize-y py-2`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-label="Catatan"
          />
        </label>

        {mode === "review" && !isRefleksi ? (
          <>
            <label className="col-span-2">
              <span className={labelClass}>{copy.aturanDilanggar}</span>
              <textarea
                rows={2}
                className={`${inputClass} resize-y py-2`}
                value={ruleBroken}
                onChange={(e) => setRuleBroken(e.target.value)}
                aria-label={copy.aturanDilanggar}
              />
            </label>
            <label className="col-span-2">
              <span className={labelClass}>{copy.pelajaran}</span>
              <textarea
                rows={2}
                className={`${inputClass} resize-y py-2`}
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                aria-label={copy.pelajaran}
              />
            </label>
          </>
        ) : null}
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <div className="flex items-center justify-between border-t border-zinc-800 pt-6">
        <button type="button" className="text-sm text-zinc-500 hover:text-zinc-200" onClick={() => router.push("/note")}>
          {copy.batal}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-950 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {pending ? copy.menyimpan : copy.simpan}
        </button>
      </div>
    </form>
  );
}

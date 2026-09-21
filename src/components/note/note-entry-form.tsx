"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { isProductionHostRouting, originFor } from "@/lib/hosts/hosts";
import { jakartaDateKey } from "@/lib/note/economic-calendar/date-range";
import { noteCopy } from "@/lib/note/copy";
import { noteSsoStartHref } from "@/lib/note/sso-urls";
import { courseClassHref } from "@/lib/security/safe-http-url";
import type { JournalKind, JournalMode } from "@/lib/note/types";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

const inputClass =
  "note-field mt-1 text-zinc-100 placeholder:text-zinc-400";

const labelClass = "block text-xs font-medium text-zinc-400";

export type NoteEntryLayer = "execution" | "cognition";

export function NoteEntryForm({
  initialDate,
  layer = "execution",
}: {
  initialDate?: string | null;
  layer?: NoteEntryLayer;
}) {
  const router = useRouter();
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const catalogBase = isProductionHostRouting() ? originFor("apex") : "";

  const cognition = layer === "cognition";
  const [kind, setKind] = useState<JournalKind>(cognition ? "REFLEKSI" : "TRADE");
  const [mode, setMode] = useState<JournalMode>("cepat");
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState("BUY");
  const [pnl, setPnl] = useState("");
  const [openedDate, setOpenedDate] = useState(initialDate ?? jakartaDateKey());
  const [note, setNote] = useState("");
  const [ruleBroken, setRuleBroken] = useState("");
  const [lesson, setLesson] = useState("");
  const [relatedCourseSlug, setRelatedCourseSlug] = useState("");
  const [relatedLessonId, setRelatedLessonId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (cognition) setKind("REFLEKSI");
    else setKind("TRADE");
  }, [cognition]);

  const pnlNumber = pnl === "" ? null : Number(pnl);
  const isRefleksi = kind === "REFLEKSI";
  const previewCourseHref = courseClassHref(catalogBase, relatedCourseSlug);

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
        symbol: isRefleksi ? relatedCourseSlug || "NOTE" : symbol,
        side: isRefleksi ? "NOTE" : side,
        pnl: isRefleksi ? null : pnlNumber,
        note: note.trim() || null,
        ruleBroken: cognition ? ruleBroken.trim() || null : null,
        lesson: cognition ? lesson.trim() || null : null,
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
      setError(body.error ?? copy.saveFailed);
      return;
    }
    router.push(cognition ? "/note/catatan" : "/note/jurnal");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-8">
      {cognition ? (
        <p className="text-sm text-zinc-400">{copy.notesCaptureHint}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        {!isRefleksi ? (
          <>
            <label className="col-span-2">
              <span className={labelClass}>{copy.colSymbol}</span>
              <input
                required
                className={inputClass}
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                aria-label={copy.colSymbol}
              />
            </label>
            <label>
              <span className={labelClass}>{copy.colSide}</span>
              <select
                className={inputClass}
                value={side}
                onChange={(e) => setSide(e.target.value)}
                aria-label={copy.colSide}
              >
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
          <span className={labelClass}>{copy.colDate}</span>
          <input
            type="date"
            className={inputClass}
            value={openedDate}
            onChange={(e) => setOpenedDate(e.target.value)}
            aria-label={copy.colDate}
          />
        </label>

        {!cognition && !isRefleksi ? (
          <label className="col-span-2">
            <span className={labelClass}>
              {prefs.locale === "en" ? "Notes (optional)" : "Catatan (opsional)"}
            </span>
            <textarea
              rows={3}
              className={`${inputClass} min-h-[4rem] resize-y py-2`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                prefs.locale === "en"
                  ? "Context, setup, how the day felt - free form. AI can link this to performance later."
                  : "Konteks, setup, perasaan hari itu - bebas. Nanti AI bisa kaitkan dengan performa."
              }
              aria-label={prefs.locale === "en" ? "Notes" : "Catatan"}
            />
          </label>
        ) : null}

        {cognition || isRefleksi ? (
          <>
            <label className="col-span-2">
              <span className={labelClass}>{copy.linkKelas}</span>
              <input
                className={inputClass}
                value={relatedCourseSlug}
                onChange={(e) => setRelatedCourseSlug(e.target.value)}
                placeholder="slug-kelas (opsional)"
                aria-label={copy.linkKelas}
              />
              {previewCourseHref ? (
                <a
                  href={previewCourseHref}
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
          </>
        ) : null}

        {cognition || isRefleksi ? (
          <label className="col-span-2">
            <span className={labelClass}>{copy.catatanRefleksi}</span>
            <textarea
              rows={5}
              required
              className={`${inputClass} min-h-[5.5rem] resize-y py-2`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-label="Catatan"
            />
          </label>
        ) : null}

        {cognition ? (
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

      {error ? <p className="note-pnl-down text-sm">{error}</p> : null}

      <div className="flex items-center justify-between border-t border-zinc-800 pt-6">
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center px-2 text-sm text-zinc-400 hover:text-zinc-200"
          onClick={() => router.push("/note")}
        >
          {copy.batal}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-md bg-zinc-100 px-5 text-sm font-medium text-zinc-950 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-400"
        >
          {pending ? copy.menyimpan : copy.simpan}
        </button>
      </div>
    </form>
  );
}

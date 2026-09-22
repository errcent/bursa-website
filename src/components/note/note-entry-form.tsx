"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { isProductionHostRouting, originFor } from "@/lib/hosts/hosts";
import { jakartaDateKey } from "@/lib/note/economic-calendar/date-range";
import { noteCopy } from "@/lib/note/copy";
import { noteSsoStartHref } from "@/lib/note/sso-urls";
import { courseClassHref } from "@/lib/security/safe-http-url";
import { parseTradeLine } from "@/lib/note/parse-trade";
import { plannedRR, formatR } from "@/lib/note/r-multiple";
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
  const [qty, setQty] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [accountLabel, setAccountLabel] = useState("");
  const [pasteText, setPasteText] = useState("");
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

  const previewRR = plannedRR(
    entryPrice === "" ? null : Number(entryPrice),
    stopLoss === "" ? null : Number(stopLoss),
    takeProfit === "" ? null : Number(takeProfit),
    side
  );

  function applyPaste() {
    const parsed = parseTradeLine(pasteText);
    if (!parsed) {
      setError(prefs.locale === "en" ? "Could not parse trade line." : "Tidak bisa parse baris trade.");
      return;
    }
    setError(null);
    setSide(parsed.side);
    setSymbol(parsed.symbol);
    if (parsed.qty != null) setQty(String(parsed.qty));
    if (parsed.entryPrice != null) setEntryPrice(String(parsed.entryPrice));
    if (parsed.stopLoss != null) setStopLoss(String(parsed.stopLoss));
    if (parsed.takeProfit != null) setTakeProfit(String(parsed.takeProfit));
    if (parsed.pnl != null) setPnl(String(parsed.pnl));
    if (parsed.accountLabel) setAccountLabel(parsed.accountLabel);
    setPasteText("");
  }

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
        qty: isRefleksi ? null : qty === "" ? null : Number(qty),
        entryPrice: isRefleksi ? null : entryPrice === "" ? null : Number(entryPrice),
        stopLoss: isRefleksi ? null : stopLoss === "" ? null : Number(stopLoss),
        takeProfit: isRefleksi ? null : takeProfit === "" ? null : Number(takeProfit),
        pnl: isRefleksi ? null : pnlNumber,
        accountLabel: accountLabel.trim() || null,
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

      {!isRefleksi ? (
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
          <label className="block">
            <span className={labelClass}>
              {prefs.locale === "en" ? "Paste a trade" : "Tempel trade"}
            </span>
            <textarea
              rows={2}
              className={`${inputClass} min-h-[3rem] resize-y py-2`}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="BUY EURUSD 0.1 @1.0850 SL 1.0820 TP 1.0920"
              aria-label={prefs.locale === "en" ? "Paste a trade" : "Tempel trade"}
            />
          </label>
          {pasteText.trim() ? (
            <button
              type="button"
              className="mt-2 inline-flex min-h-11 items-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-950 hover:bg-white"
              onClick={applyPaste}
            >
              {prefs.locale === "en" ? "Parse & fill" : "Parse & isi"}
            </button>
          ) : null}
        </div>
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
            <label>
              <span className={labelClass}>
                {prefs.locale === "en" ? "Qty (optional)" : "Qty (opsional)"}
              </span>
              <input
                type="number"
                step="any"
                className={inputClass}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                aria-label="Qty"
              />
            </label>
            <label>
              <span className={labelClass}>
                {prefs.locale === "en" ? "Entry (optional)" : "Entry (opsional)"}
              </span>
              <input
                type="number"
                step="any"
                className={inputClass}
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                aria-label="Entry price"
              />
            </label>
            <label>
              <span className={labelClass}>
                {prefs.locale === "en" ? "Stop loss (optional)" : "Stop loss (opsional)"}
              </span>
              <input
                type="number"
                step="any"
                className={inputClass}
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                aria-label="Stop loss"
              />
            </label>
            <label>
              <span className={labelClass}>
                {prefs.locale === "en" ? "Take profit (optional)" : "Take profit (opsional)"}
              </span>
              <input
                type="number"
                step="any"
                className={inputClass}
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                aria-label="Take profit"
              />
            </label>
            {previewRR != null ? (
              <p className="col-span-2 text-xs text-zinc-400">
                {prefs.locale === "en" ? "Planned R:R " : "R:R rencana "}
                <span className="font-semibold text-zinc-200">{formatR(previewRR)}</span>
              </p>
            ) : null}
            <label className="col-span-2">
              <span className={labelClass}>
                {prefs.locale === "en" ? "Account label (optional)" : "Label akun (opsional)"}
              </span>
              <input
                className={inputClass}
                value={accountLabel}
                onChange={(e) => setAccountLabel(e.target.value)}
                placeholder="Personal, FTMO 100K, ..."
                aria-label="Account label"
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

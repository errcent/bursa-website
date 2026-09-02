"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CLINIC_MODULES, FREE_CLINIC_MODULE_ID } from "@/lib/note/taxonomy";
import type { JournalKind, JournalMode } from "@/lib/note/types";

const EMOTIONS = ["tenang", "yakin", "cemas", "marah", "FOMO", "lega", "malu"];

export function NoteEntryForm({ initialMode }: { initialMode: JournalMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<JournalMode>(initialMode);
  const [kind, setKind] = useState<JournalKind>("TRADE");
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState("BUY");
  const [pnl, setPnl] = useState("");
  const [emotion, setEmotion] = useState("tenang");
  const [note, setNote] = useState("");
  const [ruleBroken, setRuleBroken] = useState("");
  const [lesson, setLesson] = useState("");
  const [clinicModuleId, setClinicModuleId] = useState(FREE_CLINIC_MODULE_ID);
  const [protocol, setProtocol] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const clinic = useMemo(
    () => CLINIC_MODULES.find((m) => m.id === clinicModuleId),
    [clinicModuleId]
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/note/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        mode,
        symbol,
        side,
        pnl: pnl === "" ? null : Number(pnl),
        emotion,
        note,
        ruleBroken: mode === "cepat" ? null : ruleBroken,
        lesson: mode === "cepat" ? null : lesson,
        clinicModuleId: mode === "klinik" ? clinicModuleId : null,
        protocol: mode === "klinik" ? protocol || clinic?.protocol : null,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setPending(false);
    if (res.status === 401) {
      window.location.href = `/api/note/sso/start?next=${encodeURIComponent(`/note/baru?mode=${mode}`)}`;
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
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-5">
      <div className="flex flex-wrap gap-2">
        {(["cepat", "review", "klinik"] as const).map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={mode === item ? "default" : "outline"}
            onClick={() => setMode(item)}
          >
            {item === "cepat" ? "Cepat" : item === "review" ? "Review" : "Klinik"}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Jenis
          <select
            className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3"
            value={kind}
            onChange={(e) => setKind(e.target.value as JournalKind)}
          >
            <option value="TRADE">Trade</option>
            <option value="INVEST">Invest</option>
          </select>
        </label>
        <label className="text-sm">
          Sisi
          <select
            className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3"
            value={side}
            onChange={(e) => setSide(e.target.value)}
          >
            <option value="BUY">BUY / Long</option>
            <option value="SELL">SELL / Short</option>
            <option value="HOLD">HOLD</option>
            <option value="DCA">DCA</option>
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          Simbol
          <input
            required
            className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="BBCA / EURUSD / BTC"
          />
        </label>
        <label className="text-sm">
          PnL (opsional)
          <input
            type="number"
            step="any"
            className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3"
            value={pnl}
            onChange={(e) => setPnl(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Emosi
          <select
            className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3"
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
          >
            {EMOTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm">
        Satu kalimat
        <textarea
          required
          rows={2}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Apa yang terjadi, tanpa drama."
        />
      </label>

      {mode !== "cepat" ? (
        <>
          <label className="block text-sm">
            Aturan yang dilanggar
            <input
              className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3"
              value={ruleBroken}
              onChange={(e) => setRuleBroken(e.target.value)}
              placeholder="Contoh: entry tanpa stop"
            />
          </label>
          <label className="block text-sm">
            Satu pelajaran
            <input
              className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3"
              value={lesson}
              onChange={(e) => setLesson(e.target.value)}
            />
          </label>
        </>
      ) : null}

      {mode === "klinik" ? (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <label className="block text-sm">
            Modul
            <select
              className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3"
              value={clinicModuleId}
              onChange={(e) => {
                setClinicModuleId(e.target.value);
                setProtocol(CLINIC_MODULES.find((m) => m.id === e.target.value)?.protocol ?? "");
              }}
            >
              {CLINIC_MODULES.map((mod) => (
                <option key={mod.id} value={mod.id}>
                  {mod.name}
                </option>
              ))}
            </select>
          </label>
          {clinic ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {clinic.questions.map((q) => (
                <li key={q.id}>{q.prompt}</li>
              ))}
            </ul>
          ) : null}
          <label className="block text-sm">
            Protokol 1 langkah
            <textarea
              rows={2}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              value={protocol || clinic?.protocol || ""}
              onChange={(e) => setProtocol(e.target.value)}
            />
          </label>
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/note")}>
          Batal
        </Button>
      </div>
    </form>
  );
}

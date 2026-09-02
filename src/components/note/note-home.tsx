"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { JournalEntry } from "@/lib/note/types";

type Payload = {
  entries: JournalEntry[];
  plus: boolean;
  reviewCountThisWeek: number;
};

function formatPnl(value: number | null) {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("id-ID")}`;
}

export function NoteHome() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/note/entries", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = `/api/note/sso/start?next=${encodeURIComponent("/note")}`;
          return null;
        }
        if (!res.ok) throw new Error("Gagal memuat jurnal.");
        return (await res.json()) as Payload;
      })
      .then((payload) => {
        if (!cancelled && payload) setData(payload);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pnlSum = useMemo(
    () => (data?.entries ?? []).reduce((sum, e) => sum + (e.pnl ?? 0), 0),
    [data]
  );

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (!data) {
    return <p className="text-sm text-muted-foreground">Memuat jurnal…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <p className="text-xs text-muted-foreground">PnL semua</p>
          <p className="mt-1 font-heading text-2xl">{formatPnl(pnlSum)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <p className="text-xs text-muted-foreground">Entry terlihat</p>
          <p className="mt-1 font-heading text-2xl">{data.entries.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <p className="text-xs text-muted-foreground">Review minggu ini</p>
          <p className="mt-1 font-heading text-2xl">{data.reviewCountThisWeek}</p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm text-muted-foreground">
          Pilih mode — Cepat untuk habit, Review setelah sesi, Klinik saat pola berulang.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/note/baru?mode=cepat" />}>Cepat</Button>
          <Button variant="outline" render={<Link href="/note/baru?mode=review" />}>
            Review
          </Button>
          <Button variant="outline" render={<Link href="/note/baru?mode=klinik" />}>
            Klinik
          </Button>
          <Button variant="ghost" render={<Link href="/note/impor" />}>
            Impor CSV
          </Button>
        </div>
      </div>

      {data.entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada entry. Mulai dari Cepat (20 detik) — jangan tunggu Review panjang setelah rugi.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {data.entries.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">
                  {entry.symbol} · {entry.side} · {entry.kind === "INVEST" ? "Invest" : "Trade"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.mode} {entry.emotion ? `· ${entry.emotion}` : ""} {entry.note ? `· ${entry.note}` : ""}
                </p>
              </div>
              <p className="text-sm tabular-nums">{formatPnl(entry.pnl)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

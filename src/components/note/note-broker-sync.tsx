"use client";

import { useCallback, useEffect, useState } from "react";

import { useNotePrefs } from "@/lib/note/use-note-prefs";
import type { SyncAccountPublic, SyncBroker, SyncRunSummary } from "@/lib/note/sync/types";
import { cn } from "@/lib/utils";

/**
 * Broker sync panel (BYOK, read-only). Keys are encrypted server-side and
 * never rendered back — the list shows masked hints only.
 */
export function NoteBrokerSync() {
  const [prefs] = useNotePrefs();
  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);
  const [accounts, setAccounts] = useState<SyncAccountPublic[]>([]);
  const [broker, setBroker] = useState<SyncBroker>("binance");
  const [label, setLabel] = useState("");
  const [keyA, setKeyA] = useState("");
  const [keyB, setKeyB] = useState("");
  const [symbols, setSymbols] = useState("BTCUSDT");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/note/sync/accounts", { credentials: "include" });
      const json = (await res.json().catch(() => ({}))) as { accounts?: SyncAccountPublic[] };
      if (res.ok) setAccounts(json.accounts ?? []);
    } catch {
      /* offline: keep last state */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function addAccount() {
    setBusy(true);
    setError(null);
    setNotice(null);
    const payload =
      broker === "binance"
        ? { broker, label, apiKey: keyA, apiSecret: keyB, symbols: symbols.split(/[,\s]+/).filter(Boolean) }
        : { broker, label, token: keyA, queryId: keyB, symbols: [] };
    try {
      const res = await fetch("/api/note/sync/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : t("Gagal menyimpan.", "Could not save."));
      } else {
        setLabel("");
        setKeyA("");
        setKeyB("");
        setNotice(t("Akun tersimpan terenkripsi.", "Account saved encrypted."));
        await refresh();
      }
    } catch {
      setError(t("Jaringan gagal.", "Network failed."));
    } finally {
      setBusy(false);
    }
  }

  async function runSync(id: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/note/sync/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });
      const json = (await res.json().catch(() => ({}))) as Partial<SyncRunSummary> & { error?: string };
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : t("Sinkron gagal.", "Sync failed."));
      } else {
        setNotice(
          t(
            `Sinkron selesai: ${json.imported ?? 0} trade dari ${json.fillsFetched ?? 0} fill.${(json.varianceFlags ?? 0) > 0 ? ` ${json.varianceFlags} selisih ditandai.` : ""}`,
            `Sync done: ${json.imported ?? 0} trades from ${json.fillsFetched ?? 0} fills.${(json.varianceFlags ?? 0) > 0 ? ` ${json.varianceFlags} variances flagged.` : ""}`,
          ),
        );
        if (json.errors?.length) setError(json.errors.slice(0, 2).join(" "));
        await refresh();
      }
    } catch {
      setError(t("Jaringan gagal.", "Network failed."));
    } finally {
      setBusy(false);
    }
  }

  async function removeAccount(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/note/sync/accounts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
      <p className="text-sm font-semibold text-zinc-100">
        {t("Sinkron broker (kunci milikmu, read-only)", "Broker sync (your keys, read-only)")}
      </p>
      <p className="mt-0.5 text-xs leading-snug text-zinc-400">
        {t(
          "Tempel API key read-only. Kunci terenkripsi di server dan tidak pernah ditampilkan lagi. Sinkron hanya membaca riwayat trade.",
          "Paste a read-only API key. Keys are encrypted server-side and never shown again. Sync only reads trade history.",
        )}
      </p>

      {accounts.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {accounts.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-200">
                  {a.label} <span className="text-xs text-zinc-500">· {a.broker} · {a.keyHint}</span>
                </p>
                <p className="text-xs text-zinc-500">
                  {a.symbols.join(", ") || "—"}
                  {a.lastSyncAt ? ` · ${t("terakhir", "last")} ${a.lastSyncAt.slice(0, 10)}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void runSync(a.id)}
                  className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-50"
                >
                  {t("Sinkron", "Sync")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void removeAccount(a.id)}
                  className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md px-2 text-xs text-zinc-500 hover:text-rose-300 disabled:opacity-50"
                  aria-label={t("Hapus akun", "Delete account")}
                >
                  {t("Hapus", "Delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-zinc-400">Broker</span>
          <select
            className="note-field mt-1 block min-h-9 coarse:min-h-11 text-sm"
            value={broker}
            onChange={(e) => setBroker(e.target.value as SyncBroker)}
            aria-label="Broker"
          >
            <option value="binance">Binance Spot</option>
            <option value="ibkr-flex">IBKR Flex</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-zinc-400">{t("Label", "Label")}</span>
          <input
            className="note-field mt-1 block min-h-9 coarse:min-h-11 text-sm text-zinc-100"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Binance utama"
            aria-label={t("Label", "Label")}
          />
        </label>
        <label className="block">
          <span className="text-xs text-zinc-400">{broker === "binance" ? "API Key" : "Token"}</span>
          <input
            type="password"
            autoComplete="off"
            className="note-field mt-1 block min-h-9 coarse:min-h-11 text-sm text-zinc-100"
            value={keyA}
            onChange={(e) => setKeyA(e.target.value)}
            aria-label={broker === "binance" ? "API Key" : "Token"}
          />
        </label>
        <label className="block">
          <span className="text-xs text-zinc-400">{broker === "binance" ? "API Secret" : "Query ID"}</span>
          <input
            type="password"
            autoComplete="off"
            className="note-field mt-1 block min-h-9 coarse:min-h-11 text-sm text-zinc-100"
            value={keyB}
            onChange={(e) => setKeyB(e.target.value)}
            aria-label={broker === "binance" ? "API Secret" : "Query ID"}
          />
        </label>
        {broker === "binance" ? (
          <label className="block sm:col-span-2">
            <span className="text-xs text-zinc-400">{t("Simbol (koma)", "Symbols (comma)")}</span>
            <input
              className="note-field mt-1 block min-h-9 coarse:min-h-11 text-sm text-zinc-100"
              value={symbols}
              onChange={(e) => setSymbols(e.target.value)}
              placeholder="BTCUSDT, ETHUSDT"
              aria-label={t("Simbol", "Symbols")}
            />
          </label>
        ) : null}
      </div>

      <button
        type="button"
        disabled={busy || !keyA.trim() || !keyB.trim()}
        onClick={() => void addAccount()}
        className={cn(
          "mt-3 inline-flex min-h-9 coarse:min-h-11 items-center rounded-md bg-zinc-100 px-4 text-xs font-medium text-zinc-950 hover:bg-white",
          "disabled:opacity-50",
        )}
      >
        {t("Simpan kunci terenkripsi", "Save encrypted keys")}
      </button>
      {notice ? <p className="mt-2 text-xs text-emerald-300">{notice}</p> : null}
      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}

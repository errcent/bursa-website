"use client";

import { useCallback, useEffect, useState } from "react";

import { useNotePrefs } from "@/lib/note/use-note-prefs";
import {
  EMPTY_PROP_LEDGER,
  summarizePropLedger,
  type PropLedger,
  type PropPhase,
} from "@/lib/note/prop/ledger";
import { cn } from "@/lib/utils";

/**
 * Prop firm cash tracker: what was paid, refunded, requested, received.
 * Separate ledger from trade P&L. No FX conversion — per-currency totals.
 */
export function NotePropView() {
  const [prefs] = useNotePrefs();
  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);
  const [ledger, setLedger] = useState<PropLedger>(EMPTY_PROP_LEDGER);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAccount, setShowAccount] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showPayout, setShowPayout] = useState(false);

  const [firm, setFirm] = useState("");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [phase, setPhase] = useState<PropPhase>("evaluation");
  const [flowKind, setFlowKind] = useState<"expense" | "refund">("expense");
  const [flowAccount, setFlowAccount] = useState("");
  const [flowCategory, setFlowCategory] = useState("evaluation");
  const [flowAmount, setFlowAmount] = useState("");
  const [flowDate, setFlowDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payoutAccount, setPayoutAccount] = useState("");
  const [payoutGross, setPayoutGross] = useState("");
  const [payoutShare, setPayoutShare] = useState("90");
  const [payoutFee, setPayoutFee] = useState("0");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/note/prop", { credentials: "include" });
      const json = (await res.json().catch(() => ({}))) as { ledger?: PropLedger };
      if (res.ok && json.ledger) setLedger(json.ledger);
    } catch {
      /* offline */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function act(action: string, payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/note/prop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, payload }),
      });
      const json = (await res.json().catch(() => ({}))) as { ledger?: PropLedger; error?: string };
      if (!res.ok || !json.ledger) {
        setError(typeof json.error === "string" ? json.error : t("Gagal menyimpan.", "Could not save."));
      } else {
        setLedger(json.ledger);
        setShowAccount(false);
        setShowFlow(false);
        setShowPayout(false);
      }
    } catch {
      setError(t("Jaringan gagal.", "Network failed."));
    } finally {
      setBusy(false);
    }
  }

  const totals = summarizePropLedger(ledger);
  const currencies = Object.keys(totals);
  const today = new Date().toISOString().slice(0, 10);

  if (loading) return <p className="text-sm text-zinc-400">{t("Memuat…", "Loading…")}</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      {currencies.length === 0 ? (
        <p className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-4 py-6 text-center text-sm text-zinc-400">
          {t("Belum ada data prop. Tambah akun evaluation pertama di bawah.", "No prop data yet. Add your first evaluation account below.")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {currencies.map((c) => {
            const s = totals[c]!;
            return (
              <div key={c} className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
                <p className="text-xs font-medium text-zinc-400">{c}</p>
                <p className={cn("mt-1 font-heading text-xl tabular-nums", s.netCash >= 0 ? "note-pnl-up" : "note-pnl-down")}>
                  {s.netCash.toLocaleString()}
                </p>
                <p className="mt-1 text-xs tabular-nums text-zinc-400">
                  {t("keluar", "out")} {s.netSpend.toLocaleString()} · {t("masuk", "in")} {s.received.toLocaleString()}
                  {s.cashROI != null ? ` · ROI ${s.cashROI}%` : ""}
                </p>
                {s.outstanding > 0 ? (
                  <p className="mt-0.5 text-xs text-amber-300">
                    {t("Menunggu", "Pending")} {s.outstanding.toLocaleString()} ({s.pending})
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => { setShowAccount((v) => !v); setShowFlow(false); setShowPayout(false); }} className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md border border-zinc-700 px-3 text-xs text-zinc-200 hover:bg-zinc-800">
          {t("+ Akun", "+ Account")}
        </button>
        <button type="button" onClick={() => { setShowFlow((v) => !v); setShowAccount(false); setShowPayout(false); }} className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md border border-zinc-700 px-3 text-xs text-zinc-200 hover:bg-zinc-800">
          {t("+ Biaya / refund", "+ Cost / refund")}
        </button>
        <button type="button" onClick={() => { setShowPayout((v) => !v); setShowAccount(false); setShowFlow(false); }} className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md border border-zinc-700 px-3 text-xs text-zinc-200 hover:bg-zinc-800">
          {t("+ Payout", "+ Payout")}
        </button>
      </div>

      {showAccount ? (
        <div className="grid gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3 sm:grid-cols-2">
          <input className="note-field min-h-9 coarse:min-h-11 text-sm" placeholder={t("Firma (mis. FTMO)", "Firm (e.g. FTMO)")} value={firm} onChange={(e) => setFirm(e.target.value)} aria-label={t("Firma", "Firm")} />
          <input className="note-field min-h-9 coarse:min-h-11 text-sm" placeholder={t("Nama akun", "Account name")} value={name} onChange={(e) => setName(e.target.value)} aria-label={t("Nama akun", "Account name")} />
          <input className="note-field min-h-9 coarse:min-h-11 text-sm" placeholder="USD" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} aria-label="Currency" maxLength={3} />
          <select className="note-field min-h-9 coarse:min-h-11 text-sm" value={phase} onChange={(e) => setPhase(e.target.value as PropPhase)} aria-label="Phase">
            {(["evaluation", "verification", "funded", "instant", "live"] as PropPhase[]).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button type="button" disabled={busy || !firm.trim() || !name.trim()} onClick={() => void act("account", { firm, name, currency: currency || "USD", phase, openedAt: today })} className="inline-flex min-h-9 coarse:min-h-11 items-center justify-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-50 sm:col-span-2">
            {t("Simpan akun", "Save account")}
          </button>
        </div>
      ) : null}

      {showFlow ? (
        <div className="grid gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3 sm:grid-cols-2">
          <select className="note-field min-h-9 coarse:min-h-11 text-sm" value={flowKind} onChange={(e) => setFlowKind(e.target.value as "expense" | "refund")} aria-label={t("Jenis", "Kind")}>
            <option value="expense">{t("Biaya", "Expense")}</option>
            <option value="refund">Refund</option>
          </select>
          <select className="note-field min-h-9 coarse:min-h-11 text-sm" value={flowAccount} onChange={(e) => setFlowAccount(e.target.value)} aria-label={t("Akun", "Account")}>
            <option value="">{t("Biaya umum firma", "Shared firm cost")}</option>
            {ledger.accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.firm} · {a.name}</option>
            ))}
          </select>
          <input className="note-field min-h-9 coarse:min-h-11 text-sm" placeholder={t("Kategori (evaluation/reset/...)", "Category")} value={flowCategory} onChange={(e) => setFlowCategory(e.target.value)} aria-label={t("Kategori", "Category")} />
          <input type="number" min={0} step="any" className="note-field min-h-9 coarse:min-h-11 text-sm" placeholder="150" value={flowAmount} onChange={(e) => setFlowAmount(e.target.value)} aria-label={t("Jumlah", "Amount")} />
          <input type="date" className="note-field min-h-9 coarse:min-h-11 text-sm" value={flowDate} onChange={(e) => setFlowDate(e.target.value)} aria-label={t("Tanggal", "Date")} />
          <input className="note-field min-h-9 coarse:min-h-11 text-sm" placeholder="USD" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} aria-label="Currency" maxLength={3} />
          <button type="button" disabled={busy || !flowAmount} onClick={() => void act("flow", { accountId: flowAccount || null, firm: firm || ledger.accounts.find((a) => a.id === flowAccount)?.firm || "—", kind: flowKind, category: flowCategory || "other", amount: Number(flowAmount), currency: currency || "USD", date: flowDate })} className="inline-flex min-h-9 coarse:min-h-11 items-center justify-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-50 sm:col-span-2">
            {t("Simpan", "Save")}
          </button>
        </div>
      ) : null}

      {showPayout ? (
        <div className="grid gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3 sm:grid-cols-2">
          <select className="note-field min-h-9 coarse:min-h-11 text-sm sm:col-span-2" value={payoutAccount} onChange={(e) => setPayoutAccount(e.target.value)} aria-label={t("Akun funded", "Funded account")}>
            <option value="">{t("Pilih akun", "Pick account")}</option>
            {ledger.accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.firm} · {a.name} ({a.phase})</option>
            ))}
          </select>
          <input type="number" min={0} step="any" className="note-field min-h-9 coarse:min-h-11 text-sm" placeholder={t("Gross diminta", "Gross requested")} value={payoutGross} onChange={(e) => setPayoutGross(e.target.value)} aria-label={t("Gross", "Gross")} />
          <input type="number" min={0} max={100} step="any" className="note-field min-h-9 coarse:min-h-11 text-sm" placeholder="90" value={payoutShare} onChange={(e) => setPayoutShare(e.target.value)} aria-label={t("Share %", "Share %")} />
          <input type="number" min={0} step="any" className="note-field min-h-9 coarse:min-h-11 text-sm" placeholder={t("Fee", "Fee")} value={payoutFee} onChange={(e) => setPayoutFee(e.target.value)} aria-label={t("Fee", "Fee")} />
          <button type="button" disabled={busy || !payoutAccount || !payoutGross} onClick={() => void act("payout", { accountId: payoutAccount, requestedAt: today, requestedGross: Number(payoutGross), traderSharePct: Number(payoutShare || 100), expectedFee: Number(payoutFee || 0) })} className="inline-flex min-h-9 coarse:min-h-11 items-center justify-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-50">
            {t("Catat request", "Log request")}
          </button>
        </div>
      ) : null}

      {ledger.accounts.length > 0 ? (
        <div className="rounded-lg border border-zinc-800/80">
          <div className="border-b border-zinc-800/80 px-3 py-2">
            <p className="text-sm font-semibold text-zinc-200">{t("Akun", "Accounts")}</p>
          </div>
          <ul className="divide-y divide-zinc-800/80">
            {ledger.accounts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-200">{a.firm} · {a.name}</p>
                  <p className="text-xs text-zinc-500">{a.phase} · {a.status} · {a.currency}</p>
                </div>
                <div className="flex gap-1">
                  {(["passed", "breached", "closed", "archived"] as const).map((s) => (
                    <button key={s} type="button" disabled={busy || a.status === s} onClick={() => void act("resolve", { accountId: a.id, status: s })} className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md px-2 text-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-40">
                      {s}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {ledger.payouts.length > 0 ? (
        <div className="rounded-lg border border-zinc-800/80">
          <div className="border-b border-zinc-800/80 px-3 py-2">
            <p className="text-sm font-semibold text-zinc-200">Payouts</p>
          </div>
          <ul className="divide-y divide-zinc-800/80">
            {ledger.payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-200">
                    {p.requestedGross.toLocaleString()} · {p.traderSharePct}% · {p.status}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {p.requestedAt.slice(0, 10)} · {t("diterima", "received")} {p.receipts.reduce((a, r) => a + r.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  {(["approved", "completed"] as const).map((s) => (
                    <button key={s} type="button" disabled={busy || p.status === s} onClick={() => void act("payout-status", { payoutId: p.id, status: s })} className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md px-2 text-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-40">
                      {s}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}

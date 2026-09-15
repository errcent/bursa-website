"use client";

import { useMemo, useState } from "react";

import { useNoteTrack, type AddTxInput } from "@/components/note/track/note-track-context";
import { todayDdMmYy } from "@/lib/note/track/datetime";
import type { TrackQuoteCurrency, TrackTxType } from "@/lib/note/track/types";
import { cn } from "@/lib/utils";

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold text-zinc-50">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm text-zinc-500 hover:text-zinc-200">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const field =
  "mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-100";

export function CreatePortfolioDialog({ locale, onClose }: { locale: "id" | "en"; onClose: () => void }) {
  const { createPortfolio } = useNoteTrack();
  const [name, setName] = useState("");
  const t = (id: string, en: string) => (locale === "en" ? en : id);

  return (
    <ModalShell title={t("Buat portfolio", "Create portfolio")} onClose={onClose}>
      <label className="block text-[11px] text-zinc-500">
        {t("Nama", "Name")}
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Core IDX" />
      </label>
      <button
        type="button"
        className="mt-4 w-full rounded-md bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white"
        onClick={() => {
          createPortfolio(name);
          onClose();
        }}
      >
        {t("Simpan", "Save")}
      </button>
    </ModalShell>
  );
}

export function AddTransactionDialog({
  locale,
  portfolioId,
  quoteCurrency,
  onClose,
}: {
  locale: "id" | "en";
  portfolioId: string;
  quoteCurrency: TrackQuoteCurrency;
  onClose: () => void;
}) {
  const { addTx } = useNoteTrack();
  const [type, setType] = useState<TrackTxType>("buy");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [fee, setFee] = useState("0");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayDdMmYy());
  const [hour, setHour] = useState("10");
  const [ampm, setAmpm] = useState<"AM" | "PM">("AM");
  const [error, setError] = useState<string | null>(null);

  const t = (id: string, en: string) => (locale === "en" ? en : id);

  const totalSpent = useMemo(() => {
    const q = Number(quantity);
    const p = Number(price);
    const f = Number(fee) || 0;
    if (!Number.isFinite(q) || !Number.isFinite(p)) return null;
    if (type === "sell") return q * p - f;
    return q * p + f;
  }, [quantity, price, fee, type]);

  const submit = () => {
    const input: AddTxInput = {
      portfolioId,
      type,
      symbol,
      quantity: Number(quantity),
      unitPrice: type === "transfer_in" && !price ? null : Number(price),
      quoteCurrency,
      fee: Number(fee) || 0,
      note,
      dateDdMmYy: date,
      hour12: Number(hour),
      ampm,
    };
    const res = addTx(input);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onClose();
  };

  return (
    <ModalShell title={t("Tambah transaksi", "Add transaction")} onClose={onClose}>
      <div className="flex gap-1 rounded-lg border border-zinc-800 p-1">
        {(["buy", "sell", "transfer_in"] as TrackTxType[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setType(k)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-xs font-medium capitalize",
              type === k ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            {k === "transfer_in" ? "Transfer in" : k}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <label className="block text-[11px] text-zinc-500">
          {t("Aset / simbol", "Asset")}
          <input className={field} value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="BBCA" />
        </label>
        <label className="block text-[11px] text-zinc-500">
          {t("Quantity", "Quantity")}
          <input className={field} inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        {type !== "transfer_in" || price ? (
          <label className="block text-[11px] text-zinc-500">
            {t("Harga per unit", "Price per unit")} ({quoteCurrency})
            <input className={field} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </label>
        ) : (
          <p className="text-xs text-zinc-500">{t("Opsional: isi harga untuk cost basis.", "Optional: price for cost basis.")}</p>
        )}
        <div className="grid grid-cols-3 gap-2">
          <label className="col-span-1 block text-[11px] text-zinc-500">
            {t("Tanggal", "Date")} (DD/MM/YY)
            <input className={field} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block text-[11px] text-zinc-500">
            {t("Jam", "Time")}
            <input className={field} inputMode="numeric" value={hour} onChange={(e) => setHour(e.target.value)} />
          </label>
          <label className="block text-[11px] text-zinc-500">
            AM/PM
            <select className={field} value={ampm} onChange={(e) => setAmpm(e.target.value as "AM" | "PM")}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </label>
        </div>
        <label className="block text-[11px] text-zinc-500">
          Fee ({quoteCurrency})
          <input className={field} inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} />
        </label>
        <label className="block text-[11px] text-zinc-500">
          {t("Catatan", "Notes")}
          <textarea className={cn(field, "min-h-[4rem]")} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {totalSpent != null && type !== "transfer_in" ? (
          <p className="text-sm tabular-nums text-zinc-300">
            {type === "sell" ? t("Total proceeds", "Total proceeds") : t("Total spent", "Total spent")}:{" "}
            <span className="font-medium text-zinc-100">{totalSpent.toLocaleString()}</span> {quoteCurrency}
          </p>
        ) : null}
        {error ? <p className="text-xs text-rose-400">{error}</p> : null}
      </div>

      <button
        type="button"
        className="mt-4 w-full rounded-md bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white"
        onClick={submit}
      >
        {t("Add transaction", "Add transaction")}
      </button>
    </ModalShell>
  );
}

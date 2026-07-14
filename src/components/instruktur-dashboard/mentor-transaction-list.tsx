"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  fetchMentorTransactions,
  type MentorTransactionItem,
} from "@/lib/instruktur-dashboard/api";
import { formatRupiah } from "@/lib/mock-data";

const payoutLabels: Record<string, string> = {
  PENDING: "Menunggu payout",
  PROCESSING: "Diproses",
  PAID: "Sudah dibayarkan",
  REFUNDED: "Direfund",
  FAILED: "Gagal",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TransactionRow({ item }: { item: MentorTransactionItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="surface-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-col gap-2 p-4 text-left sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
          <p className="font-heading text-sm font-medium">{item.courseTitle}</p>
          <p className="text-xs text-muted-foreground">Pembeli: {item.learnerInitials}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="font-mono text-sm tabular-nums">{formatRupiah(item.grossAmount)}</span>
          <Badge variant="outline">
            {payoutLabels[item.payoutStatus] ?? item.payoutStatus}
          </Badge>
        </div>
      </button>
      {open && (
        <div className="border-t border-border bg-muted/20 px-4 py-3 text-sm">
          <dl className="grid gap-2 sm:grid-cols-2">
            <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
              <dt className="text-muted-foreground">ID transaksi</dt>
              <dd className="font-mono text-xs">{item.transactionId.slice(0, 12)}…</dd>
            </div>
            <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
              <dt className="text-muted-foreground">Komisi ({item.commissionPct}%)</dt>
              <dd className="font-mono tabular-nums">{formatRupiah(item.commissionAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
              <dt className="text-muted-foreground">Net mentor</dt>
              <dd className="font-mono tabular-nums text-emerald">
                {formatRupiah(item.netMentorAmount)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
              <dt className="text-muted-foreground">Periode payout</dt>
              <dd>{item.payoutPeriod ?? "—"}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

export function MentorTransactionList() {
  const [items, setItems] = useState<MentorTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchMentorTransactions()
      .then((data) => {
        if (!cancelled) setItems(data.items);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface-card p-6 text-center text-sm text-destructive">{error}</div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="surface-card flex flex-col items-center gap-3 p-8 text-center">
        <p className="font-heading text-sm font-medium">Belum ada transaksi</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Transaksi muncul setelah siswa menyelesaikan checkout. Payout mentor diproses bulanan —
          komisi platform 25% ditampilkan di setiap baris.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <TransactionRow key={item.id} item={item} />
      ))}
    </div>
  );
}

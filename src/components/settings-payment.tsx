"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Building2,
  CreditCard,
  Loader2,
  Plus,
  QrCode,
  Receipt,
  Smartphone,
  Star,
  Trash2,
  Wallet,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { buildLoginHref } from "@/lib/auth/redirect";
import { formatRupiah } from "@/lib/mock-data";
import {
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethodKind,
} from "@/lib/payment/methods";
import {
  addSavedPaymentMethod,
  getSavedPaymentMethods,
  removeSavedPaymentMethod,
  setDefaultPaymentMethod,
  subscribeSavedPaymentMethods,
  type SavedPaymentMethod,
} from "@/lib/payment/saved-methods";
import { cn } from "@/lib/utils";

const METHOD_ICONS: Record<
  PaymentMethodKind,
  React.ComponentType<{ className?: string }>
> = {
  ewallet: Smartphone,
  bank_transfer: Building2,
  card: CreditCard,
  qris: QrCode,
};

interface BillingTransaction {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  courseTitle: string;
  courseSlug: string;
}

const MOCK_BILLING: BillingTransaction[] = [
  {
    id: "mock-tx-1",
    amount: 499000,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    courseTitle: "Fundamental Saham untuk Pemula",
    courseSlug: "fundamental-saham-pemula",
  },
  {
    id: "mock-tx-2",
    amount: 349000,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    courseTitle: "Crypto On-Chain Analysis",
    courseSlug: "crypto-on-chain",
  },
];

function formatTxDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function statusLabel(status: string) {
  switch (status) {
    case "COMPLETED":
      return "Berhasil";
    case "PENDING":
      return "Menunggu";
    case "FAILED":
      return "Gagal";
    case "REFUNDED":
      return "Dikembalikan";
    default:
      return status;
  }
}

function MethodIcon({ kind, className }: { kind: PaymentMethodKind; className?: string }) {
  const Icon = METHOD_ICONS[kind];
  return <Icon className={className} />;
}

function SavedMethodRow({
  method,
  onSetDefault,
  onRemove,
}: {
  method: SavedPaymentMethod;
  onSetDefault: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const option = PAYMENT_METHOD_OPTIONS.find((m) => m.id === method.methodId);
  const kind = option?.kind ?? "ewallet";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
          <MethodIcon kind={kind} className="size-4.5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{method.label}</p>
            {method.isDefault ? (
              <Badge
                variant="outline"
                className="border-emerald/30 bg-emerald/10 text-emerald-200"
              >
                <Star className="size-3 fill-current" />
                Default
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {option?.description ?? "Metode pembayaran tersimpan"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
        {!method.isDefault ? (
          <Button size="sm" variant="outline" onClick={() => onSetDefault(method.id)}>
            Jadikan default
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(method.id)}
          aria-label={`Hapus ${method.label}`}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function AddPaymentSheet({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (methodId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>("gopay");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    onAdd(selectedId);
    setSaving(false);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        overlayClassName="bg-black/50 supports-backdrop-filter:backdrop-blur-sm"
        className="max-h-[88dvh] gap-0 overflow-y-auto rounded-t-2xl border-border/60 px-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:mx-auto sm:max-w-lg sm:rounded-t-2xl"
      >
        <SheetHeader className="border-b border-border/60 px-4 pb-3 text-left">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border/80 sm:hidden" aria-hidden />
          <SheetTitle className="font-heading text-lg">Tambah Metode Pembayaran</SheetTitle>
          <SheetDescription>
            Prototipe — penyimpanan aman akan diaktifkan setelah integrasi Midtrans.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 px-4 py-4">
          {PAYMENT_METHOD_OPTIONS.map((option) => {
            const selected = selectedId === option.id;
            return (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors",
                  selected
                    ? "border-foreground/20 bg-foreground/5"
                    : "border-border bg-surface/40 hover:border-foreground/15"
                )}
              >
                <input
                  type="radio"
                  name="add-payment-method"
                  value={option.id}
                  checked={selected}
                  onChange={() => setSelectedId(option.id)}
                  className="size-4 accent-foreground"
                />
                <MethodIcon kind={option.kind} className="size-4.5 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </label>
            );
          })}
        </div>

        <SheetFooter className="border-t border-border/60 px-4 pt-4">
          <Button className="min-h-11 w-full btn-primary" disabled={saving} onClick={handleSave}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Simpan metode
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function SettingsPayment() {
  const { session, isLoading } = useAuth();
  const { messages } = useLanguage();
  const t = messages.settings.payment;
  const common = messages.common;
  const [billing, setBilling] = useState<BillingTransaction[]>([]);
  const [billingLoading, setBillingLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const methods = useSyncExternalStore(
    subscribeSavedPaymentMethods,
    () =>
      session
        ? getSavedPaymentMethods(session.userId, session.email)
        : [],
    () => []
  );

  useEffect(() => {
    if (!session) return;

    let cancelled = false;

    void (async () => {
      setBillingLoading(true);
      try {
        const res = await fetch(
          `/api/me/transactions?email=${encodeURIComponent(session.email)}`,
          {
            headers: {
              "x-user-email": session.email,
              ...(session.userId ? { "x-user-id": session.userId } : {}),
            },
          }
        );
        const data: { transactions?: BillingTransaction[] } = res.ok
          ? await res.json()
          : { transactions: [] };
        if (cancelled) return;
        const rows = data.transactions ?? [];
        setBilling(rows.length > 0 ? rows : MOCK_BILLING);
      } catch {
        if (!cancelled) setBilling(MOCK_BILLING);
      } finally {
        if (!cancelled) setBillingLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  function handleAdd(methodId: string) {
    if (!session) return;
    addSavedPaymentMethod(session.userId, { methodId });
  }

  function handleSetDefault(id: string) {
    if (!session) return;
    setDefaultPaymentMethod(session.userId, id);
  }

  function handleRemove(id: string) {
    if (!session) return;
    removeSavedPaymentMethod(session.userId, id);
  }

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-muted" />;
  }

  if (!session) {
    return (
      <section className="surface-card p-5">
        <h2 className="section-title text-base">{t.title}</h2>
        <p className="section-copy mt-2">{t.signedOutDescription}</p>
        <Button
          size="sm"
          variant="outline"
          className="mt-4"
          render={<Link href={buildLoginHref("/pengaturan")} />}
        >
          {common.signIn}
        </Button>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="section-title">{t.title}</h2>
          <p className="section-copy mt-1">{t.description}</p>
        </div>
        <Badge
          variant="outline"
          className="mt-2 w-fit border-amber-400/30 bg-amber-400/10 text-amber-200 sm:mt-0"
        >
          Mode Demo
        </Badge>
      </div>

      <div className="mt-4 flex gap-3 rounded-xl border border-amber-400/25 bg-amber-400/5 p-4">
        <Wallet className="size-5 shrink-0 text-amber-300" />
        <p className="text-sm leading-relaxed text-amber-200/90">
          Penyimpanan metode pembayaran masih simulasi di perangkat ini. Integrasi Midtrans
          (transfer bank, e-wallet GoPay/OVO/DANA, kartu kredit, QRIS) akan mengaktifkan
          checkout real dan sinkronisasi aman di fase produksi (P3).
        </p>
      </div>

      <div className="surface-card mt-6 space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Metode tersimpan</p>
            <p className="text-xs text-muted-foreground">
              {methods.length === 0
                ? "Belum ada metode — tambahkan untuk checkout lebih cepat."
                : `${methods.length} metode tersimpan`}
            </p>
          </div>
          <Button size="sm" className="btn-primary w-full sm:w-auto" onClick={() => setAddOpen(true)}>
            <Plus className="size-3.5" />
            Tambah metode
          </Button>
        </div>

        {methods.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/30 px-4 py-8 text-center">
            <CreditCard className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              Belum ada kartu atau e-wallet tersimpan.
            </p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setAddOpen(true)}>
              Tambah metode pertama
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {methods.map((method) => (
              <SavedMethodRow
                key={method.id}
                method={method}
                onSetDefault={handleSetDefault}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>

      <div className="surface-card mt-6 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Riwayat tagihan</p>
            <p className="text-xs text-muted-foreground">3 transaksi terakhir</p>
          </div>
          <Button size="sm" variant="ghost" className="w-fit text-muted-foreground" disabled>
            <Receipt className="size-3.5" />
            Semua transaksi
            <Badge variant="outline" className="ml-1 text-[10px]">
              Segera
            </Badge>
          </Button>
        </div>

        {billingLoading ? (
          <div className="mt-4 flex h-16 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : billing.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Belum ada transaksi. Setelah checkout kelas, riwayat akan muncul di sini.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60">
            {billing.map((tx) => (
              <li
                key={tx.id}
                className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/kelas/${tx.courseSlug}`}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {tx.courseTitle}
                  </Link>
                  <p className="text-xs text-muted-foreground">{formatTxDate(tx.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3 sm:shrink-0">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      tx.status === "COMPLETED"
                        ? "border-emerald/30 bg-emerald/10 text-emerald-200"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {statusLabel(tx.status)}
                  </Badge>
                  <span className="font-mono text-sm tabular-nums">{formatRupiah(tx.amount)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddPaymentSheet open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />
    </section>
  );
}

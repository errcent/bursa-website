"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Loader2,
  QrCode,
  Smartphone,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCourseEnrollment } from "@/hooks/use-course-enrollment";
import { calculateCheckoutBreakdown } from "@/lib/pricing";
import { formatRupiah } from "@/lib/mock-data";
import type { Course, Mentor } from "@/lib/types";
import { cn } from "@/lib/utils";

const paymentMethods = [
  { id: "gopay", label: "GoPay / E-Wallet", icon: Smartphone },
  { id: "va", label: "Transfer Virtual Account", icon: CreditCard },
  { id: "qris", label: "QRIS", icon: QrCode },
] as const;

export function CheckoutForm({
  course,
  mentor,
}: {
  course: Course;
  mentor: Mentor;
}) {
  const router = useRouter();
  const { enrolled, loading: enrollmentLoading } = useCourseEnrollment(course.slug);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<(typeof paymentMethods)[number]["id"]>("gopay");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const breakdown = calculateCheckoutBreakdown(course.price);
  const learnHref = `/belajar/${course.slug}/l1`;

  async function handleSimulatePayment() {
    if (!acceptedDisclaimer || enrolled) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    router.push(`/checkout/sukses?course=${course.slug}`);
  }

  if (enrollmentLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-xl border border-border bg-card">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (enrolled) {
    return (
      <Card className="mx-auto max-w-lg border-border bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-emerald/30 bg-emerald/10">
            <CheckCircle2 className="size-6 text-emerald" />
          </div>
          <CardTitle className="mt-2">Sudah berlangganan</CardTitle>
          <CardDescription>
            Anda sudah memiliki akses ke{" "}
            <span className="text-foreground/90">{course.title}</span>. Checkout tidak diperlukan lagi.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1 btn-primary" render={<Link href={learnHref} />}>
            Lanjut Belajar
          </Button>
          <Button variant="outline" className="flex-1" render={<Link href="/komunitas" />}>
            Buka Komunitas
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">
      <div className="flex flex-col gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Metode Pembayaran</CardTitle>
              <Badge variant="outline" className="border-amber-400/30 bg-amber-400/10 text-amber-200">
                Mode Demo
              </Badge>
            </div>
            <CardDescription>
              Pilih metode simulasi — pembayaran real akan aktif setelah integrasi Midtrans (P3).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const selected = selectedMethod === method.id;
              return (
                <label
                  key={method.id}
                  className={cn(
                    "flex cursor-not-allowed items-center gap-3 rounded-xl border p-4 opacity-60",
                    selected ? "border-foreground/20 bg-foreground/5" : "border-border bg-surface/40"
                  )}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={method.id}
                    checked={selected}
                    disabled
                    onChange={() => setSelectedMethod(method.id)}
                    className="size-4 accent-foreground"
                  />
                  <Icon className="size-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{method.label}</span>
                </label>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex gap-3 rounded-xl border border-amber-400/25 bg-amber-400/5 p-4">
          <AlertTriangle className="size-5 shrink-0 text-amber-300" />
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed text-amber-200/90">
              Materi kelas ini bersifat edukasi umum, bukan rekomendasi atau ajakan beli-jual
              instrumen tertentu. Trading dan investasi mengandung risiko kerugian modal.
            </p>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={acceptedDisclaimer}
                onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
                className="mt-0.5 size-4 rounded border-border accent-foreground"
              />
              <span className="text-sm text-foreground/90">
                Saya paham bahwa ini edukasi, bukan rekomendasi investasi, dan keputusan trading
                sepenuhnya tanggung jawab saya.
              </span>
            </label>
          </div>
        </div>

        <Button
          size="lg"
          className="h-11 w-full btn-primary sm:w-auto sm:min-w-64"
          disabled={!acceptedDisclaimer || isSubmitting}
          onClick={handleSimulatePayment}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Memproses simulasi...
            </>
          ) : (
            <>
              <Wallet className="size-4" />
              Simulasikan Pembayaran
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Tidak ada biaya yang dikenakan. Tombol di atas hanya mensimulasikan alur checkout untuk
          demo mentor & investor.
        </p>
      </div>

      <Card className="border-border bg-card lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle>Ringkasan Pesanan</CardTitle>
          <CardDescription>
            Pembayaran langsung ke mentor (bukan per modul) — platform mengambil komisi transaksi.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface/50 p-4">
            <p className="font-heading text-sm font-medium leading-snug">{course.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mentor:{" "}
              <Link href={`/instruktur/${mentor.slug}`} className="text-foreground/80 hover:underline">
                {mentor.name}
              </Link>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {course.durationHours} jam · Akses selamanya
            </p>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Biaya belajar ke mentor</span>
              <span>{formatRupiah(breakdown.coursePrice)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Komisi platform ({breakdown.commissionRatePercent}%)</span>
              <span>− {formatRupiah(breakdown.platformFee)}</span>
            </div>
            <div className="flex justify-between text-emerald">
              <span>Mentor menerima</span>
              <span>{formatRupiah(breakdown.mentorPayout)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="font-heading font-medium">Total dibayar</span>
            <span className="text-xl font-semibold font-mono tabular-nums">
              {formatRupiah(breakdown.coursePrice)}
            </span>
          </div>

          <p className="rounded-lg border border-border bg-surface/40 p-3 text-xs leading-relaxed text-muted-foreground">
            Komisi {breakdown.commissionRatePercent}% digunakan untuk infrastruktur platform, review
            konten kelas, dan dukungan teknis. Harga yang Anda bayar = harga yang ditetapkan mentor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

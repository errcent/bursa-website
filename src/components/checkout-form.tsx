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


import { CourseThumbnail } from "@/components/course-thumbnail";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth-provider";
import { useCourseEnrollment } from "@/hooks/use-course-enrollment";
import { buildLoginHref } from "@/lib/auth/redirect";
import { KOMUNITAS_ENABLED } from "@/lib/features/komunitas";
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
  const { session, isLoading: authLoading } = useAuth();
  const { enrolled, loading: enrollmentLoading } = useCourseEnrollment(course.slug);
  const checkoutPath = `/checkout/${course.slug}`;
  const loginHref = buildLoginHref(checkoutPath);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<(typeof paymentMethods)[number]["id"]>("gopay");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const learnHref = `/belajar/${course.slug}/l1`;

  async function handleSimulatePayment() {
    if (!acceptedDisclaimer || enrolled) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    router.push(`/checkout/sukses?course=${course.slug}`);
  }

  if (authLoading || enrollmentLoading) {
    return (
      <div className="surface-card flex min-h-48 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="surface-card mx-auto max-w-lg overflow-hidden">
        <div className="px-6 py-8 text-center">
          <h2 className="font-heading text-lg font-medium">Masuk untuk checkout</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Kamu perlu masuk ke akun untuk menyelesaikan pembelian dan mengaktifkan akses kelas{" "}
            <span className="text-foreground/90">{course.title}</span>.
          </p>
        </div>
        <div className="flex flex-col gap-2 border-t border-border/60 px-6 py-5 sm:flex-row">
          <Button className="flex-1 btn-primary" render={<Link href={loginHref} />}>
            Masuk
          </Button>
          <Button variant="outline" className="flex-1" render={<Link href="/daftar" />}>
            Daftar
          </Button>
        </div>
      </div>
    );
  }

  if (enrolled) {
    return (
      <div className="surface-card mx-auto max-w-lg overflow-hidden">
        <div className="px-6 py-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-emerald/30 bg-emerald/10">
            <CheckCircle2 className="size-6 text-emerald" />
          </div>
          <h2 className="mt-3 font-heading text-lg font-medium">Sudah berlangganan</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Anda sudah memiliki akses ke{" "}
            <span className="text-foreground/90">{course.title}</span>. Checkout tidak diperlukan lagi.
          </p>
        </div>
        <div className="flex flex-col gap-2 border-t border-border/60 px-6 py-5 sm:flex-row">
          <Button className="flex-1 btn-primary" render={<Link href={learnHref} />}>
            Lanjut Belajar
          </Button>
          {KOMUNITAS_ENABLED && (
            <Button variant="outline" className="flex-1" render={<Link href="/komunitas" />}>
              Buka Komunitas
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">
      <div className="flex flex-col gap-6">
        <div className="surface-card overflow-hidden">
          <div className="border-b border-border/60 px-5 py-4 sm:px-6">
            <h2 className="font-heading text-base font-medium sm:text-lg">Metode Pembayaran</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Pilih metode pembayaran yang kamu inginkan.
            </p>
          </div>
          <div className="flex flex-col gap-3 p-5 sm:p-6">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const selected = selectedMethod === method.id;
              return (
                <label
                  key={method.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors",
                    selected ? "border-foreground/20 bg-foreground/5" : "border-border bg-surface/40 hover:border-foreground/15"
                  )}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={method.id}
                    checked={selected}
                    onChange={() => setSelectedMethod(method.id)}
                    className="size-4 accent-foreground"
                  />
                  <Icon className="size-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{method.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="surface-card flex gap-4 p-5 sm:p-6">
          <AlertTriangle className="size-5 shrink-0 text-amber-300" />
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed text-amber-200/90">
              Materi kelas ini bersifat edukasi umum untuk memahami analisis dan manajemen risiko,
              bukan rekomendasi, nasihat, atau ajakan beli-jual instrumen tertentu. Trading dan
              investasi berisiko kerugian modal. Kinerja masa lalu tidak menjamin hasil di masa
              depan. Bursa tidak menjanjikan keuntungan pasti.
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
              Memproses pembayaran...
            </>
          ) : (
            <>
              <Wallet className="size-4" />
              Bayar Sekarang
            </>
          )}
        </Button>
      </div>

      <div className="surface-card overflow-hidden lg:sticky lg:top-24">
        <div className="border-b border-border/60 px-5 py-4 sm:px-6">
          <h2 className="font-heading text-base font-medium sm:text-lg">Ringkasan Pesanan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pembayaran sekali untuk akses kelas selamanya.
          </p>
        </div>
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-surface/40">
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <CourseThumbnail
                course={course}
                fillSlot
                className="absolute inset-0"
                alt={course.title}
              />
            </div>
            <div className="p-4">
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
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Harga kelas</span>
              <span className="tabular-nums">{formatRupiah(course.price)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="font-heading font-medium">Total dibayar</span>
            <span className="font-heading text-xl font-semibold tabular-nums">
              {formatRupiah(course.price)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

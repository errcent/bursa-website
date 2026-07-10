"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useCourseEnrollment } from "@/hooks/use-course-enrollment";

export function CourseDetailMobileCheckout({
  courseSlug,
  priceLabel,
  checkoutHref,
}: {
  courseSlug: string;
  priceLabel: string;
  checkoutHref: string;
}) {
  const { enrolled, loading } = useCourseEnrollment(courseSlug);
  const learnHref = `/belajar/${courseSlug}/l1`;

  if (loading) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur sm:hidden">
        <div className="h-12 w-full animate-pulse rounded-lg bg-muted/40" />
      </div>
    );
  }

  if (enrolled) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur sm:hidden">
        <div className="mb-2 rounded-lg border border-emerald/20 bg-emerald/5 px-3 py-2">
          <p className="text-xs font-medium text-emerald">Sudah berlangganan</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Lanjut belajar atau buka komunitas mentor.
          </p>
        </div>
        <Button className="h-12 w-full btn-primary text-sm font-semibold" render={<Link href={learnHref} />}>
          Lanjut Belajar
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur sm:hidden">
      <div className="mb-2 rounded-lg border border-border bg-card px-3 py-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Bayar ke mentor (sekali untuk 1 kelas)</p>
          <p className="font-mono text-sm font-semibold">{priceLabel}</p>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Bukan biaya per modul/lesson, langsung lanjut ke checkout aman.
        </p>
      </div>
      <Button
        className="h-12 w-full btn-primary text-sm font-semibold"
        render={<Link href={checkoutHref} />}
      >
        Checkout Sekarang
      </Button>
    </div>
  );
}

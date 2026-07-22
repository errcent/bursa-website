"use client";

import Link from "next/link";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCourseEnrollment } from "@/hooks/use-course-enrollment";
import { canPurchaseCourse } from "@/lib/catalog/payment-gate";

export function CourseDetailMobileCheckout({
  courseSlug,
  priceLabel,
  checkoutHref,
  price,
}: {
  courseSlug: string;
  priceLabel: string;
  checkoutHref: string;
  price: number;
}) {
  const { enrolled, loading } = useCourseEnrollment(courseSlug);
  const learnHref = `/belajar/${courseSlug}/l1`;
  const purchaseAvailable = canPurchaseCourse(price);

  if (loading) {
    return (
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 p-3 backdrop-blur-md sm:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="h-12 w-full animate-pulse rounded-full bg-muted/40" />
      </div>
    );
  }

  if (enrolled) {
    return (
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 p-3 backdrop-blur-md sm:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <Button className="h-12 w-full btn-primary text-sm font-semibold" render={<Link href={learnHref} />}>
          <Play className="size-4 fill-current" />
          Lanjut Belajar
        </Button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md sm:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-3 px-3 pt-3">
        <div className="min-w-0 flex-1">
          {purchaseAvailable ? (
            <>
              <p className="text-[11px] text-muted-foreground">Sekali bayar · akses selamanya</p>
              <p className="font-heading text-lg font-semibold tabular-nums">{priceLabel}</p>
            </>
          ) : (
            <>
              <p className="text-[11px] font-medium text-accent">Segera hadir</p>
              <p className="font-heading text-base font-semibold leading-snug">
                Gabung waitlist · preview gratis
              </p>
            </>
          )}
        </div>
        <Button
          className="h-12 min-h-12 shrink-0 px-6 btn-primary text-sm font-semibold"
          render={
            <Link href={purchaseAvailable ? checkoutHref : "/waitlist"} />
          }
        >
          {purchaseAvailable ? "Checkout" : "Waitlist"}
        </Button>
      </div>
    </div>
  );
}

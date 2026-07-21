"use client";

import Link from "next/link";
import { Check, Clock, Play, ShieldCheck, Users } from "lucide-react";

import { BookmarkToggleButton } from "@/components/bookmark-toggle-button";
import { CourseThumbnail } from "@/components/course-thumbnail";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { useCourseEnrollment } from "@/hooks/use-course-enrollment";
import { canPurchaseCourse } from "@/lib/catalog/payment-gate";
import { KOMUNITAS_ENABLED } from "@/lib/features/komunitas";
import type { Course } from "@/lib/types";
import { hasRating } from "@/lib/utils";

export function CourseDetailCheckoutPanel({
  course,
  priceLabel,
  checkoutHref,
  previewHref,
  totalLessons,
}: {
  course: Course;
  priceLabel: string;
  checkoutHref: string;
  previewHref: string;
  totalLessons: number;
}) {
  const { enrolled, loading } = useCourseEnrollment(course.slug);
  const learnHref = `/belajar/${course.slug}/l1`;
  const purchaseAvailable = canPurchaseCourse(course.price);

  if (loading) {
    return (
      <section className="border-t border-border/60 bg-card">
        <div className="container-page py-10 sm:py-12">
          <div className="mx-auto max-w-3xl animate-pulse space-y-4">
            <div className="aspect-[16/10] w-full rounded-xl bg-muted/40" />
            <div className="h-11 rounded-full bg-muted/40" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-border/60 bg-card">
      <div className="container-page py-10 sm:py-12">
        <div className="mx-auto max-w-3xl">
          {enrolled ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-emerald">Sudah berlangganan</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Akses kelas aktif — lanjutkan dari video terakhir.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="h-11 btn-primary text-sm font-semibold sm:min-w-[180px]"
                  render={<Link href={learnHref} />}
                >
                  <Play className="size-4 fill-current" />
                  Lanjut Belajar
                </Button>
                {KOMUNITAS_ENABLED && (
                  <Button variant="outline" className="h-11 sm:min-w-[160px]" render={<Link href="/komunitas" />}>
                    Buka Komunitas
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 sm:gap-8">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border">
                <CourseThumbnail
                  course={course}
                  fillSlot
                  className="absolute inset-0"
                  alt={course.title}
                />
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Harga kelas</p>
                    <p className="mt-1 font-heading text-3xl font-semibold tracking-tight tabular-nums">
                      {priceLabel}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">Sekali bayar · akses selamanya</p>
                  </div>
                  <BookmarkToggleButton
                    bookmarkRef={{ type: "course", slug: course.slug }}
                    className="opacity-100"
                  />
                </div>

                {hasRating(course.rating) && (
                  <StarRating rating={course.rating} className="text-sm" />
                )}

                <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Clock className="size-4 shrink-0 text-foreground" />
                    {course.durationHours} jam · {totalLessons} video
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="size-4 shrink-0 text-foreground" />
                    {course.studentsCount.toLocaleString("id-ID")} siswa
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="size-4 shrink-0 text-emerald" />
                    Akses lifetime + update materi
                  </li>
                </ul>

                <div className="flex flex-col gap-2 sm:flex-row">
                  {purchaseAvailable ? (
                    <Button
                      className="h-12 flex-1 btn-primary text-sm font-semibold"
                      render={<Link href={checkoutHref} />}
                    >
                      Checkout Sekarang
                    </Button>
                  ) : (
                    <Button
                      className="h-12 flex-1 btn-primary text-sm font-semibold"
                      render={<Link href="/waitlist" />}
                    >
                      Segera Hadir — Gabung Waitlist
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="h-12 flex-1"
                    render={<Link href={previewHref} />}
                  >
                    <Play className="size-4 fill-current" />
                    Mulai Preview Gratis
                  </Button>
                </div>

                <ul className="flex flex-col gap-1.5 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3 shrink-0 text-emerald" />
                    Pembayaran langsung ke mentor
                  </li>
                  {!purchaseAvailable && (
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3 shrink-0 text-emerald" />
                      Checkout online segera dibuka — daftar waitlist untuk info pertama
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** @deprecated Use CourseDetailCheckoutPanel */
export const CourseDetailCheckoutSidebar = CourseDetailCheckoutPanel;

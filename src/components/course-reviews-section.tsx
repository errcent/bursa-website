import { Star } from "lucide-react";

import type { Review } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CourseReviewsSectionProps {
  reviews: Review[];
  rating?: number;
  ratingCount?: number;
}

export function CourseReviewsSection({
  reviews,
  rating,
  ratingCount,
}: CourseReviewsSectionProps) {
  if (reviews.length === 0) return null;

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-title">Ulasan Siswa</h2>
          {rating !== undefined && rating > 0 && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Star className="size-3.5 fill-foreground text-foreground" />
              <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
              {ratingCount !== undefined && ratingCount > 0 && (
                <span>· {ratingCount.toLocaleString("id-ID")} ulasan</span>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {reviews.map((review) => (
          <article
            key={`${review.name}-${review.date}`}
            className="surface-card flex min-w-0 flex-col gap-3 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 font-heading text-xs font-medium text-foreground"
                  aria-hidden
                >
                  {review.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{review.name}</p>
                  <p className="text-[11px] text-muted-foreground">{review.date}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5" aria-label={`Rating ${review.rating} dari 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "size-3",
                      i < review.rating
                        ? "fill-foreground text-foreground"
                        : "fill-transparent text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            </div>
            <blockquote className="text-sm leading-relaxed text-muted-foreground">
              &ldquo;{review.comment}&rdquo;
            </blockquote>
          </article>
        ))}
      </div>
    </section>
  );
}

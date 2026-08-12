import { Star } from "lucide-react";

import type { Review } from "@/lib/types";
import { PREVIEW_CATALOG_COPY } from "@/lib/preview-catalog/copy";
import { isPreviewCatalogActive } from "@/lib/preview-catalog/visibility";
import { cn } from "@/lib/utils";

interface CourseReviewsSectionProps {
  reviews: Review[];
}

export function CourseReviewsSection({ reviews }: CourseReviewsSectionProps) {
  if (reviews.length === 0) return null;

  const showPreviewLabel = isPreviewCatalogActive();

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-title">Ulasan Siswa</h2>
          {showPreviewLabel ? (
            <p className="mt-1.5 text-xs text-muted-foreground">{PREVIEW_CATALOG_COPY.reviewsLabel}</p>
          ) : null}
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

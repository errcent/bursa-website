"use client";

import type { ReactNode } from "react";

import { CourseCard } from "@/components/course-card";
import { GuidancePickCarousel } from "@/components/learning-guidance/guidance-pick-carousel";
import { PlaylistCard } from "@/components/playlist/playlist-card";
import {
  GUIDANCE_SUPPORTING_MOBILE_PEEK_RATIO,
  guidanceSupportingGetScrollPerView,
} from "@/components/scroll-carousel";
import { useCatalogIndex } from "@/hooks/use-catalog-index";
import { cn } from "@/lib/utils";
import { guidancePickKey, guidancePickReason } from "@/lib/learning/guidance/pick-presenters";
import type { ScoredGuidancePick } from "@/lib/learning/guidance/types";

export function GuidanceSupportingCarousel({
  picks,
  sectionLink,
}: {
  picks: ScoredGuidancePick[];
  sectionLink?: ReactNode;
}) {
  const { index: catalogIndex } = useCatalogIndex();

  return (
    <GuidancePickCarousel
      items={picks}
      ariaLabel="Rekomendasi pendukung"
      sectionTitle="Eksplorasi lanjutan"
      sectionLink={sectionLink}
      getPerView={guidanceSupportingGetScrollPerView}
      mobilePeekRatio={GUIDANCE_SUPPORTING_MOBILE_PEEK_RATIO}
      bleedClassName="guidance-supporting-carousel-bleed"
      className="guidance-supporting-carousel"
      getItemKey={guidancePickKey}
      getReason={guidancePickReason}
      renderCard={(pick) => {
        const cardWrap = (node: ReactNode) => (
          <div className={cn("mx-auto w-full max-w-[220px] sm:max-w-none")}>{node}</div>
        );
        if (pick.kind === "course" && pick.course) {
          const mentor =
            catalogIndex?.mentors.find((item) => item.slug === pick.course!.mentorSlug) ?? null;
          return cardWrap(
            <CourseCard
              course={pick.course}
              mentor={mentor}
              variant="featured"
              hideBookmark
              className="w-full"
            />
          );
        }
        if (pick.kind === "playlist" && pick.playlist) {
          return cardWrap(
            <PlaylistCard
              playlist={pick.playlist}
              variant="featured"
              hideBookmark
              className="w-full"
            />
          );
        }
        return null;
      }}
    />
  );
}

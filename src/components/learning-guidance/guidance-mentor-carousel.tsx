"use client";

import { useRef, useState } from "react";

import {
  DiscoverInfiniteCarousel,
  type InfiniteCarouselHandle,
} from "@/components/infinite-carousel";
import { MentorCard } from "@/components/mentor-card";
import { peekGetScrollPerView } from "@/components/scroll-carousel";
import type { ScoredMentor } from "@/lib/learning/guidance/types";

/** Vertical mentor tile width on mobile — one card + peek of the next. */
const GUIDANCE_MENTOR_PEEK_RATIO = 0.56;
const GUIDANCE_MENTOR_GAP = 12;

export function GuidanceReasonTags({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return null;

  return (
    <ul className="flex flex-wrap justify-center gap-1.5 px-1">
      {reasons.map((reason) => (
        <li
          key={reason}
          className="rounded-md border border-border/60 bg-surface/50 px-2 py-0.5 text-[11px] leading-snug text-muted-foreground"
        >
          {reason}
        </li>
      ))}
    </ul>
  );
}

export function GuidanceMentorCarousel({ mentors }: { mentors: ScoredMentor[] }) {
  const carouselRef = useRef<InfiniteCarouselHandle>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (mentors.length === 0) return null;

  if (mentors.length === 1) {
    return (
      <div className="mx-auto flex w-full max-w-[11.5rem] flex-col gap-2.5">
        <MentorCard mentor={mentors[0].mentor} variant="default" hideBookmark />
        <GuidanceReasonTags reasons={mentors[0].reasons} />
      </div>
    );
  }

  return (
    <div className="relative min-w-0">
      <div className="guidance-mentor-carousel-bleed relative z-[1] min-w-0">
        <DiscoverInfiniteCarousel
          ref={carouselRef}
          items={mentors}
          ariaLabel="Mentor yang cocok untuk profil belajarmu"
          getPerView={peekGetScrollPerView}
          gap={GUIDANCE_MENTOR_GAP}
          mobilePeekRatio={GUIDANCE_MENTOR_PEEK_RATIO}
          allowDragFromSlides
          onActiveIndexChange={setActiveIndex}
          getItemKey={(entry) => entry.mentor.slug}
          renderItem={(entry) => (
            <div className="flex w-full flex-col gap-2">
              <MentorCard
                mentor={entry.mentor}
                variant="default"
                hideBookmark
                className="w-full"
              />
            </div>
          )}
        />
      </div>

      <div className="relative z-[1] mt-3 min-h-[2.5rem] px-4">
        <GuidanceReasonTags reasons={mentors[activeIndex]?.reasons ?? []} />
      </div>

      <div
        className="relative z-[1] mt-4 flex items-center justify-center gap-3"
        role="tablist"
        aria-label="Navigasi mentor rekomendasi"
      >
        {mentors.map((entry, index) => (
          <button
            key={entry.mentor.slug}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-current={index === activeIndex}
            aria-label={`Ke mentor ${index + 1}: ${entry.mentor.name}`}
            onClick={() => carouselRef.current?.goToIndex(index)}
            className="carousel-dot"
          />
        ))}
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {activeIndex + 1}/{mentors.length}
        </span>
      </div>
    </div>
  );
}

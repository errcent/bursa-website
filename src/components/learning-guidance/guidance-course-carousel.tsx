"use client";

import type { ReactNode } from "react";

import { CourseCard } from "@/components/course-card";
import { GuidancePickCarousel } from "@/components/learning-guidance/guidance-pick-carousel";
import { useCatalogIndex } from "@/hooks/use-catalog-index";
import type { ScoredCourse } from "@/lib/learning/guidance/types";

export function GuidanceCourseCarousel({
  courses,
  sectionLink,
}: {
  courses: ScoredCourse[];
  sectionLink?: ReactNode;
}) {
  const { index: catalogIndex } = useCatalogIndex();

  return (
    <GuidancePickCarousel
      items={courses}
      ariaLabel="Kelas rekomendasi"
      sectionTitle="Kelas"
      sectionLink={sectionLink}
      getItemKey={(entry) => entry.course.slug}
      getReason={(entry) => entry.reasons[0]}
      renderCard={(entry) => {
        const mentor =
          catalogIndex?.mentors.find((item) => item.slug === entry.course.mentorSlug) ?? null;
        return (
          <CourseCard
            course={entry.course}
            mentor={mentor}
            variant="featured"
            hideBookmark
            className="w-full"
          />
        );
      }}
    />
  );
}

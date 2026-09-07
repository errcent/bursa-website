"use client";

import { CatalogCarouselRow } from "@/components/catalog-carousel-row";
import { CourseCard } from "@/components/course-card";
import { catalogCourseGetScrollPerView } from "@/components/scroll-carousel";
import type { LearningCourseProgress } from "@/hooks/use-my-learning";
import { courseEnrollmentFromLearning } from "@/lib/learning/enrollment";
import type { Course, Mentor } from "@/lib/types";

export type CatalogCourseRowProps = {
  title: string;
  courses: Course[];
  mentorBySlug: Map<string, Mentor>;
  enrollmentBySlug?: Map<string, LearningCourseProgress>;
  hideBookmark?: boolean;
  cardVariant?: "default" | "catalog";
};

export function CatalogCourseRow({
  title,
  courses,
  mentorBySlug,
  enrollmentBySlug,
  hideBookmark = false,
  cardVariant,
}: CatalogCourseRowProps) {
  if (courses.length === 0) return null;

  return (
    <CatalogCarouselRow title={title} getPerView={catalogCourseGetScrollPerView}>
      {courses.map((course) => (
        <CourseCard
          key={course.slug}
          course={course}
          className="w-full"
          variant={cardVariant}
          mentor={mentorBySlug.get(course.mentorSlug) ?? null}
          enrollment={
            enrollmentBySlug
              ? courseEnrollmentFromLearning(enrollmentBySlug.get(course.slug))
              : undefined
          }
          hideBookmark={hideBookmark}
        />
      ))}
    </CatalogCarouselRow>
  );
}

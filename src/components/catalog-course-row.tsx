"use client";

import { CourseCard } from "@/components/course-card";
import {
  SCROLL_CAROUSEL_GAP,
  ScrollCarousel,
  catalogCourseGetScrollPerView,
} from "@/components/scroll-carousel";
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
    <section className="catalog-row" aria-label={title}>
      <h3 className="catalog-row-title">{title}</h3>
      <div className="catalog-row-bleed md:hidden">
        <div className="catalog-row-scroll">
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
        </div>
      </div>
      <div className="catalog-row-bleed hidden md:block">
        <ScrollCarousel
          ariaLabel={title}
          getPerView={catalogCourseGetScrollPerView}
          gap={SCROLL_CAROUSEL_GAP}
        >
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
        </ScrollCarousel>
      </div>
    </section>
  );
}

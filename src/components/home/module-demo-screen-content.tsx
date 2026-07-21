"use client";

import { useMemo, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "motion/react";

import { CourseCard } from "@/components/course-card";
import { CourseCurriculumCards } from "@/components/course-curriculum-cards";
import { CourseDetailHero } from "@/components/course-detail-hero";
import { CourseInstructorSection } from "@/components/course-instructor-section";
import { DeviceLearningPreview } from "@/components/home/device-learning-preview";
import { DEVICE_SCREEN_SCALE } from "@/components/home/device-screen-scale";
import { LearningGuidanceEntry } from "@/components/learning-guidance/learning-guidance-entry";
import {
  SCROLL_CAROUSEL_GAP,
  ScrollCarousel,
  catalogCourseGetScrollPerView,
} from "@/components/scroll-carousel";
import { rankCoursesByQuality } from "@/lib/catalog/ranking";
import { cn, hasRating } from "@/lib/utils";
import type { Course, Lesson, Mentor } from "@/lib/types";

const PHASE = {
  catalog: { start: 0, end: 0.15 },
  class: { start: 0.15, end: 0.30 },
  modules: { start: 0.30, end: 0.42 },
  workspace: { start: 0.42, end: 1 },
} as const;

const PHASE_FADE = 0.035;

function usePhaseOpacity(
  progress: MotionValue<number>,
  start: number,
  end: number,
  fade = PHASE_FADE,
) {
  return useTransform(progress, (p) => {
    if (p < start) {
      if (start === 0) return 1;
      if (p <= start - fade) return 0;
      return (p - (start - fade)) / (fade * 2);
    }
    if (p > end) {
      if (p >= end + fade) return 0;
      return 1 - (p - (end - fade)) / (fade * 2);
    }
    return 1;
  });
}

function pickHighlightLesson(course: Course): {
  lesson: Lesson;
  moduleTitle: string;
  moduleIndex: number;
  lessonIndex: number;
} | null {
  for (let mi = 0; mi < course.modules.length; mi += 1) {
    const mod = course.modules[mi];
    for (let li = 0; li < mod.lessons.length; li += 1) {
      const lesson = mod.lessons[li];
      if (lesson.preview || li > 0) {
        return { lesson, moduleTitle: mod.title, moduleIndex: mi, lessonIndex: li };
      }
    }
  }
  const first = course.modules[0]?.lessons[0];
  if (!first) return null;
  return {
    lesson: first,
    moduleTitle: course.modules[0].title,
    moduleIndex: 0,
    lessonIndex: 0,
  };
}

function buildCompletedLessonIds(
  course: Course,
  moduleIndex: number,
  lessonIndex: number,
): string[] {
  const ids: string[] = [];
  for (let mi = 0; mi < course.modules.length; mi += 1) {
    const mod = course.modules[mi];
    for (let li = 0; li < mod.lessons.length; li += 1) {
      if (mi < moduleIndex || (mi === moduleIndex && li < lessonIndex)) {
        ids.push(mod.lessons[li].id);
      }
    }
  }
  return ids;
}

type CatalogCourseRowProps = {
  title: string;
  courses: Course[];
  mentorBySlug: Map<string, Mentor>;
};

/** Same markup as `CatalogCourseRow` in catalog-browser.tsx */
function DeviceCatalogCourseRow({ title, courses, mentorBySlug }: CatalogCourseRowProps) {
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
              mentor={mentorBySlug.get(course.mentorSlug) ?? null}
              hideBookmark
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
              mentor={mentorBySlug.get(course.mentorSlug) ?? null}
              hideBookmark
            />
          ))}
        </ScrollCarousel>
      </div>
    </section>
  );
}

function DeviceCatalogPhase({
  courses,
  mentorsBySlug,
  opacity,
  scrollY,
}: {
  courses: Course[];
  mentorsBySlug: Map<string, Mentor>;
  opacity: MotionValue<number>;
  scrollY: MotionValue<number>;
}) {
  const newCourses = useMemo(
    () =>
      [...courses]
        .sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 10),
    [courses],
  );

  const sahamCourses = useMemo(
    () =>
      rankCoursesByQuality(
        courses.filter((c) => c.instrument === "Saham"),
        mentorsBySlug,
      ).slice(0, 8),
    [courses, mentorsBySlug],
  );

  return (
    <motion.section
      className="device-ui-phase device-ui-phase--catalog"
      style={{ opacity }}
      data-device-phase="catalog"
      aria-hidden
    >
      <motion.div className="device-ui-phase__scroll" style={{ y: scrollY }}>
        <div className="container-page min-w-0 pt-4 sm:pt-6">
          <div className="flex min-w-0 flex-col gap-6 md:gap-10">
            <div className="catalog-section">
              <DeviceCatalogCourseRow
                title="Baru di Bursa"
                courses={newCourses}
                mentorBySlug={mentorsBySlug}
              />
              <DeviceCatalogCourseRow
                title="Saham"
                courses={sahamCourses}
                mentorBySlug={mentorsBySlug}
              />
            </div>
            <LearningGuidanceEntry />
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}

function DeviceCourseDetailPhase({
  course,
  mentor,
  opacity,
  scrollY,
}: {
  course: Course;
  mentor: Mentor | null;
  opacity: MotionValue<number>;
  scrollY: MotionValue<number>;
}) {
  return (
    <motion.section
      className="device-ui-phase device-ui-phase--class"
      style={{ opacity }}
      data-device-phase="class"
      aria-hidden
    >
      <motion.div className="device-ui-phase__scroll device-ui-phase__scroll--bleed" style={{ y: scrollY }}>
        <CourseDetailHero
          course={course}
          mentor={mentor}
          previewHref={`/belajar/${course.slug}/l1`}
        />
        {mentor ? (
          <div className="container-page min-w-0 py-8">
            <CourseInstructorSection mentor={mentor} />
          </div>
        ) : null}
      </motion.div>
    </motion.section>
  );
}

function DeviceCurriculumPhase({
  course,
  opacity,
  scrollY,
}: {
  course: Course;
  opacity: MotionValue<number>;
  scrollY: MotionValue<number>;
}) {
  return (
    <motion.section
      className="device-ui-phase device-ui-phase--modules"
      style={{ opacity }}
      data-device-phase="modules"
      aria-hidden
    >
      <motion.div className="device-ui-phase__scroll" style={{ y: scrollY }}>
        <div className="container-page min-w-0 py-8 sm:py-10">
          <section>
            <h2 className="mb-6 font-heading text-xl font-medium sm:text-2xl">Isi Kelas</h2>
            <CourseCurriculumCards course={course} hideBookmark />
          </section>
        </div>
      </motion.div>
    </motion.section>
  );
}

function DeviceWorkspacePhase({
  course,
  mentor,
  opacity,
  scrollProgress,
}: {
  course: Course;
  mentor: Mentor | null;
  opacity: MotionValue<number>;
  scrollProgress: MotionValue<number>;
}) {
  const highlight = pickHighlightLesson(course);
  if (!highlight || !mentor) return null;

  const { lesson, moduleIndex, lessonIndex } = highlight;
  const completedLessonIds = buildCompletedLessonIds(course, moduleIndex, lessonIndex);

  return (
    <motion.section
      className="device-ui-phase device-ui-phase--workspace"
      style={{ opacity }}
      data-device-phase="workspace"
      aria-hidden
    >
      <DeviceLearningPreview
        course={course}
        mentor={mentor}
        lesson={lesson}
        completedLessonIds={completedLessonIds}
        scrollProgress={scrollProgress}
        className="h-full min-h-0"
      />
    </motion.section>
  );
}

export type ModuleDemoScreenContentProps = {
  course: Course;
  mentor: Mentor | null;
  catalogCourses: Course[];
  mentorsBySlug: Map<string, Mentor>;
  scrollProgress?: MotionValue<number>;
  reducedMotion?: boolean | null;
  className?: string;
};

export function ModuleDemoScreenContent({
  course,
  mentor,
  catalogCourses,
  mentorsBySlug,
  scrollProgress,
  reducedMotion,
  className,
}: ModuleDemoScreenContentProps) {
  const staticProgress = useMotionValue(0.92);
  const progress = reducedMotion ? staticProgress : scrollProgress ?? staticProgress;

  const catalogOpacity = usePhaseOpacity(progress, PHASE.catalog.start, PHASE.catalog.end);
  const classOpacity = usePhaseOpacity(progress, PHASE.class.start, PHASE.class.end);
  const modulesOpacity = usePhaseOpacity(progress, PHASE.modules.start, PHASE.modules.end);
  const lessonOpacity = usePhaseOpacity(progress, PHASE.workspace.start, PHASE.workspace.end);

  const catalogScrollY = useTransform(progress, [0, 0.12], [0, -72]);
  const classScrollY = useTransform(progress, [0.18, 0.28], [0, -120]);
  const curriculumScrollY = useTransform(progress, [0.32, 0.40], [0, -280]);

  const [mountVideoPhases, setMountVideoPhases] = useState(Boolean(reducedMotion));

  useMotionValueEvent(progress, "change", (p) => {
    if (!mountVideoPhases && p >= PHASE.workspace.start - 0.04) {
      setMountVideoPhases(true);
    }
  });

  const stageStyle = {
    width: DEVICE_SCREEN_SCALE.designWidth,
    height: DEVICE_SCREEN_SCALE.designHeight,
    transform: `scale(${DEVICE_SCREEN_SCALE.scale})`,
  } as const;

  return (
    <div
      className={cn("device-ui-root bg-background text-foreground", className)}
      data-demo-course-slug={course.slug}
      style={{
        ["--device-design-width" as string]: `${DEVICE_SCREEN_SCALE.designWidth}px`,
        ["--device-design-height" as string]: `${DEVICE_SCREEN_SCALE.designHeight}px`,
        ["--device-content-scale" as string]: String(DEVICE_SCREEN_SCALE.scale),
      }}
    >
      <div className="device-ui-stage" style={stageStyle}>
        <DeviceCatalogPhase
          courses={catalogCourses}
          mentorsBySlug={mentorsBySlug}
          opacity={catalogOpacity}
          scrollY={catalogScrollY}
        />
        <DeviceCourseDetailPhase
          course={course}
          mentor={mentor}
          opacity={classOpacity}
          scrollY={classScrollY}
        />
        <DeviceCurriculumPhase
          course={course}
          opacity={modulesOpacity}
          scrollY={curriculumScrollY}
        />
        {mountVideoPhases ? (
          <DeviceWorkspacePhase
            course={course}
            mentor={mentor}
            opacity={lessonOpacity}
            scrollProgress={progress}
          />
        ) : null}
      </div>
    </div>
  );
}

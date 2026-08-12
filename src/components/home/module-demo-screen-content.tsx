"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "motion/react";

import { CourseCard } from "@/components/course-card";
import { DeviceLearningPreview } from "@/components/home/device-learning-preview";
import { DEVICE_SCREEN_SCALE } from "@/components/home/device-screen-scale";
import { PlaylistCard } from "@/components/playlist/playlist-card";
import { PlaylistCurriculumCards } from "@/components/playlist/playlist-curriculum-cards";
import { PlaylistDetailHero } from "@/components/playlist/playlist-detail-hero";
import { rankCoursesByQuality } from "@/lib/catalog/ranking";
import { PREVIEW_CATALOG_COPY } from "@/lib/preview-catalog/copy";
import { cn } from "@/lib/utils";
import type { PlaylistDetail, PlaylistSummary } from "@/lib/playlist/types";
import type { Course, Instrument, Lesson, Mentor } from "@/lib/types";

const PHASE = {
  catalog: { start: 0, end: 0.24 },
  detail: { start: 0.24, end: 0.52 },
  workspace: { start: 0.52, end: 1 },
} as const;

const PHASE_FADE = 0.045;

const INSTRUMENT_ROW_LABELS: Record<Instrument, string> = {
  Saham: "Saham",
  Crypto: "Cryptocurrency",
  Forex: "Foreign Exchange",
};

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

function findLessonByLegacyId(course: Course, legacyId: string | null | undefined): {
  lesson: Lesson;
  moduleIndex: number;
  lessonIndex: number;
} | null {
  if (!legacyId) return null;
  for (let mi = 0; mi < course.modules.length; mi += 1) {
    const mod = course.modules[mi];
    for (let li = 0; li < mod.lessons.length; li += 1) {
      if (mod.lessons[li].id === legacyId) {
        return { lesson: mod.lessons[li], moduleIndex: mi, lessonIndex: li };
      }
    }
  }
  return null;
}

function pickWorkspaceLesson(
  course: Course,
  preferredLessonLegacyId: string | null,
): {
  lesson: Lesson;
  moduleIndex: number;
  lessonIndex: number;
} | null {
  const preferred = findLessonByLegacyId(course, preferredLessonLegacyId);
  if (preferred) return preferred;

  for (let mi = 0; mi < course.modules.length; mi += 1) {
    const mod = course.modules[mi];
    for (let li = 0; li < mod.lessons.length; li += 1) {
      const lesson = mod.lessons[li];
      if (lesson.preview || li > 0) {
        return { lesson, moduleIndex: mi, lessonIndex: li };
      }
    }
  }

  const first = course.modules[0]?.lessons[0];
  if (!first) return null;
  return { lesson: first, moduleIndex: 0, lessonIndex: 0 };
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

function DeviceCatalogTrack({
  children,
  variant = "course",
}: {
  children: ReactNode;
  variant?: "course" | "playlist";
}) {
  return (
    <div
      className={cn(
        "device-catalog-row-scroll",
        variant === "playlist" && "device-catalog-row-scroll--playlist",
      )}
    >
      {children}
    </div>
  );
}

function DeviceCatalogPhase({
  playlists,
  courses,
  mentorsBySlug,
  highlightSlug,
  opacity,
  scrollY,
}: {
  playlists: PlaylistSummary[];
  courses: Course[];
  mentorsBySlug: Map<string, Mentor>;
  highlightSlug: string;
  opacity: MotionValue<number>;
  scrollY: MotionValue<number>;
}) {
  const orderedPlaylists = useMemo(() => {
    const highlight = playlists.find((p) => p.slug === highlightSlug);
    const rest = playlists.filter((p) => p.slug !== highlightSlug);
    return highlight ? [highlight, ...rest] : playlists;
  }, [playlists, highlightSlug]);

  const instrumentRows = useMemo(() => {
    return (["Saham", "Crypto", "Forex"] as Instrument[])
      .map((inst) => ({
        title: INSTRUMENT_ROW_LABELS[inst],
        courses: rankCoursesByQuality(
          courses.filter((c) => c.instrument === inst),
          mentorsBySlug,
        ),
      }))
      .filter((row) => row.courses.length > 0);
  }, [courses, mentorsBySlug]);

  return (
    <motion.section
      className="device-ui-phase device-ui-phase--catalog"
      style={{ opacity }}
      data-device-phase="catalog"
      aria-hidden
    >
      <motion.div className="device-ui-phase__scroll" style={{ y: scrollY }}>
        <div className="device-catalog-stack min-w-0">
          <p className="device-catalog-demo-banner" role="note">
            {PREVIEW_CATALOG_COPY.mockupBadge} · konten contoh
          </p>
          <section className="catalog-row" aria-label="Playlists">
            <h3 className="catalog-row-title">Playlists</h3>
            <DeviceCatalogTrack variant="playlist">
              {orderedPlaylists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  variant="catalog"
                  hideBookmark
                  className="w-full"
                />
              ))}
            </DeviceCatalogTrack>
          </section>

          {instrumentRows.map((row) => (
            <section key={row.title} className="catalog-row" aria-label={row.title}>
              <h3 className="catalog-row-title">{row.title}</h3>
              <DeviceCatalogTrack>
                {row.courses.map((course) => (
                  <CourseCard
                    key={course.slug}
                    course={course}
                    className="w-full"
                    variant="catalog"
                    mentor={mentorsBySlug.get(course.mentorSlug) ?? null}
                    hideBookmark
                  />
                ))}
              </DeviceCatalogTrack>
            </section>
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}

function DevicePlaylistDetailPhase({
  playlist,
  opacity,
  scrollY,
}: {
  playlist: PlaylistDetail;
  opacity: MotionValue<number>;
  scrollY: MotionValue<number>;
}) {
  return (
    <motion.section
      className="device-ui-phase device-ui-phase--class"
      style={{ opacity }}
      data-device-phase="detail"
      aria-hidden
    >
      <motion.div
        className="device-ui-phase__scroll device-ui-phase__scroll--bleed"
        style={{ y: scrollY }}
      >
        <PlaylistDetailHero
          playlist={playlist}
          firstPlayableHref={`/playlist/${playlist.slug}`}
          accessSummary={null}
          variant="device"
        />
        <div className="device-detail-list min-w-0 bg-background">
          <section>
            <h2 className="mb-5 font-heading text-xl font-medium sm:text-2xl">
              Daftar Video
            </h2>
            <PlaylistCurriculumCards playlist={playlist} hideBookmark />
          </section>
        </div>
      </motion.div>
    </motion.section>
  );
}

function DeviceWorkspacePhase({
  course,
  mentor,
  preferredLessonLegacyId,
  opacity,
  scrollProgress,
}: {
  course: Course;
  mentor: Mentor | null;
  preferredLessonLegacyId: string | null;
  opacity: MotionValue<number>;
  scrollProgress: MotionValue<number>;
}) {
  const highlight = pickWorkspaceLesson(course, preferredLessonLegacyId);
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
        workspaceStart={PHASE.workspace.start}
        className="h-full min-h-0"
      />
    </motion.section>
  );
}

export type ModuleDemoScreenContentProps = {
  playlist: PlaylistDetail;
  catalogPlaylists: PlaylistSummary[];
  catalogCourses: Course[];
  mentorsBySlug: Map<string, Mentor>;
  course: Course;
  mentor: Mentor | null;
  preferredLessonLegacyId?: string | null;
  scrollProgress?: MotionValue<number>;
  reducedMotion?: boolean | null;
  className?: string;
};

export function ModuleDemoScreenContent({
  playlist,
  catalogPlaylists,
  catalogCourses,
  mentorsBySlug,
  course,
  mentor,
  preferredLessonLegacyId = null,
  scrollProgress,
  reducedMotion,
  className,
}: ModuleDemoScreenContentProps) {
  const staticProgress = useMotionValue(0.92);
  const progress = reducedMotion ? staticProgress : scrollProgress ?? staticProgress;

  const catalogOpacity = usePhaseOpacity(progress, PHASE.catalog.start, PHASE.catalog.end);
  const detailOpacity = usePhaseOpacity(progress, PHASE.detail.start, PHASE.detail.end);
  const lessonOpacity = usePhaseOpacity(progress, PHASE.workspace.start, PHASE.workspace.end);

  const catalogScrollY = useTransform(progress, [0, 0.2], [0, -220]);
  const detailScrollY = useTransform(progress, [0.28, 0.5], [0, -240]);

  const [mountVideoPhases, setMountVideoPhases] = useState(Boolean(reducedMotion));

  useMotionValueEvent(progress, "change", (p) => {
    if (!mountVideoPhases && p >= PHASE.workspace.start - 0.05) {
      setMountVideoPhases(true);
    }
  });

  const stageStyle = {
    width: DEVICE_SCREEN_SCALE.designWidth,
    height: DEVICE_SCREEN_SCALE.designHeight,
    transform: `scale(${DEVICE_SCREEN_SCALE.scale})`,
  } as const;

  const catalogSource =
    catalogPlaylists.length > 0 ? catalogPlaylists : [playlist];

  return (
    <div
      className={cn("device-ui-root bg-background text-foreground", className)}
      data-demo-playlist-slug={playlist.slug}
      data-demo-course-slug={course.slug}
      style={{
        ["--device-design-width" as string]: `${DEVICE_SCREEN_SCALE.designWidth}px`,
        ["--device-design-height" as string]: `${DEVICE_SCREEN_SCALE.designHeight}px`,
        ["--device-content-scale" as string]: String(DEVICE_SCREEN_SCALE.scale),
      }}
    >
      <div className="device-ui-stage" style={stageStyle}>
        <DeviceCatalogPhase
          playlists={catalogSource}
          courses={catalogCourses}
          mentorsBySlug={mentorsBySlug}
          highlightSlug={playlist.slug}
          opacity={catalogOpacity}
          scrollY={catalogScrollY}
        />
        <DevicePlaylistDetailPhase
          playlist={playlist}
          opacity={detailOpacity}
          scrollY={detailScrollY}
        />
        {mountVideoPhases ? (
          <DeviceWorkspacePhase
            course={course}
            mentor={mentor}
            preferredLessonLegacyId={preferredLessonLegacyId}
            opacity={lessonOpacity}
            scrollProgress={progress}
          />
        ) : null}
      </div>
    </div>
  );
}

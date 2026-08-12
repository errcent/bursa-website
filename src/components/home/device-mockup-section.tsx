"use client";

import { useMemo, useRef, useEffect } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

import {
  DEVICE_SCENE_HEIGHT,
  DEVICE_SCENE_WIDTH,
  IpadSceneFrame,
} from "@/components/home/device-frame-shells";
import { ModuleDemoScreenContent } from "@/components/home/module-demo-screen-content";
import { useDeviceSceneScale } from "@/components/home/use-device-scene-scale";
import { Reveal } from "@/components/motion/reveal";
import { WordReveal } from "@/components/motion/word-reveal";
import { PREVIEW_CATALOG_COPY } from "@/lib/preview-catalog/copy";
import type { PlaylistDetail, PlaylistSummary } from "@/lib/playlist/types";
import type { Course, Mentor } from "@/lib/types";

type ScreenContentProps = {
  playlist: PlaylistDetail;
  catalogPlaylists: PlaylistSummary[];
  catalogCourses: Course[];
  course: Course;
  mentor: Mentor | null;
  preferredLessonLegacyId: string | null;
  scrollProgress: MotionValue<number>;
  reducedMotion: boolean | null;
  mentorsBySlug: Map<string, Mentor>;
};

function DeviceScreenContent({
  playlist,
  catalogPlaylists,
  catalogCourses,
  course,
  mentor,
  preferredLessonLegacyId,
  scrollProgress,
  reducedMotion,
  mentorsBySlug,
}: ScreenContentProps) {
  return (
    <div className="device-mockup-screen__content">
      <ModuleDemoScreenContent
        playlist={playlist}
        catalogPlaylists={catalogPlaylists}
        catalogCourses={catalogCourses}
        mentorsBySlug={mentorsBySlug}
        course={course}
        mentor={mentor}
        preferredLessonLegacyId={preferredLessonLegacyId}
        scrollProgress={scrollProgress}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}

export function DeviceMockupSection({
  playlist,
  catalogPlaylists,
  catalogCourses,
  course,
  mentor,
  preferredLessonLegacyId,
  mentors,
}: {
  playlist: PlaylistDetail | null;
  catalogPlaylists: PlaylistSummary[];
  catalogCourses: Course[];
  course: Course | null;
  mentor: Mentor | null;
  preferredLessonLegacyId?: string | null;
  mentors: Mentor[];
}) {
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { shellRef, scale } = useDeviceSceneScale(DEVICE_SCENE_WIDTH, DEVICE_SCENE_HEIGHT);

  const mentorsBySlug = useMemo(
    () => new Map(mentors.map((item) => [item.slug, item])),
    [mentors],
  );

  const demoCourse = course;
  const demoMentor =
    mentor ??
    (demoCourse ? mentorsBySlug.get(demoCourse.mentorSlug) ?? null : null);

  const { scrollYProgress } = useScroll({
    target: scrollTrackRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    scrollTrackRef.current?.setAttribute("data-scroll-progress", value.toFixed(4));
  });

  useEffect(() => {
    scrollTrackRef.current?.setAttribute("data-scroll-progress", scrollYProgress.get().toFixed(4));
  }, [scrollYProgress]);

  const rotateX = useTransform(scrollYProgress, [0, 1], [22, 0]);
  const rotateY = useTransform(scrollYProgress, [0, 1], [-5, 0]);
  const tabletScale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const translateZ = useTransform(scrollYProgress, [0, 1], [-120, 0]);

  if (!playlist || !demoCourse || demoCourse.modules.length === 0) return null;

  const screenProps = {
    playlist,
    catalogPlaylists,
    catalogCourses,
    course: demoCourse,
    mentor: demoMentor,
    preferredLessonLegacyId: preferredLessonLegacyId ?? null,
    scrollProgress: scrollYProgress,
    reducedMotion: prefersReducedMotion,
    mentorsBySlug,
  };

  const tabletMotionStyle = prefersReducedMotion
    ? undefined
    : {
        rotateX,
        rotateY,
        scale: tabletScale,
        z: translateZ,
        transformPerspective: 1100,
      };

  return (
    <section
      id="belajar-dimana-saja"
      className="section-cinematic-light section-tight scroll-mt-24"
      aria-labelledby="device-mockup-heading"
      data-playlist-slug={playlist.slug}
      data-course-slug={demoCourse.slug}
    >
      <div ref={scrollTrackRef} className="device-mockup-scroll-track">
        <div className="device-mockup-sticky">
          <div className="container-page device-mockup-sticky__inner">
            <div className="device-mockup-header mx-auto mb-4 max-w-3xl text-center md:mb-6">
              <Reveal>
                <p className="device-mockup-demo-badge mx-auto mb-4 inline-flex items-center justify-center rounded-md border border-border/70 bg-surface/80 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-foreground/85">
                  {PREVIEW_CATALOG_COPY.mockupBadge}
                </p>
              </Reveal>
              <h2 id="device-mockup-heading" className="section-display-title text-foreground">
                <WordReveal
                  as="span"
                  className="inline"
                  text="Belajar sederhana, di mana saja"
                  trigger="inView"
                  delay={0.04}
                />
              </h2>
              <Reveal delay={0.08}>
                <p className="section-copy mx-auto mt-3 max-w-xl text-pretty text-muted-foreground">
                  {PREVIEW_CATALOG_COPY.mockupNote}
                </p>
              </Reveal>
            </div>

            <div className="device-mockup-stage">
              <div className="device-mockup-perspective">
                <div
                  ref={shellRef}
                  className="device-mockup-scene-shell"
                  style={{
                    width: DEVICE_SCENE_WIDTH * scale,
                    height: DEVICE_SCENE_HEIGHT * scale,
                  }}
                >
                  <div
                    className="device-mockup-scene-canvas"
                    style={{
                      width: DEVICE_SCENE_WIDTH,
                      height: DEVICE_SCENE_HEIGHT,
                      transform: `scale(${scale})`,
                    }}
                  >
                    <motion.div
                      className="device-mockup-3d-wrapper"
                      style={tabletMotionStyle}
                    >
                      <div className="device-mockup-composition relative">
                        <p
                          className="device-mockup-demo-chip pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-black/75 px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-white/95 shadow-lg shadow-black/40 backdrop-blur-sm"
                          aria-hidden
                        >
                          Demo
                        </p>
                        <IpadSceneFrame>
                          <DeviceScreenContent {...screenProps} />
                        </IpadSceneFrame>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

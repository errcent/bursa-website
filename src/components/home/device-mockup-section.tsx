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
import type { Course, Mentor } from "@/lib/types";

type ScreenContentProps = {
  course: Course;
  mentor: Mentor | null;
  catalogCourses: Course[];
  mentorsBySlug: Map<string, Mentor>;
  scrollProgress: MotionValue<number>;
  reducedMotion: boolean | null;
};

function DeviceScreenContent({
  course,
  mentor,
  catalogCourses,
  mentorsBySlug,
  scrollProgress,
  reducedMotion,
}: ScreenContentProps) {
  return (
    <div className="device-mockup-screen__content">
      <ModuleDemoScreenContent
        course={course}
        mentor={mentor}
        catalogCourses={catalogCourses}
        mentorsBySlug={mentorsBySlug}
        scrollProgress={scrollProgress}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}

export function DeviceMockupSection({
  course,
  mentor,
  catalogCourses,
  mentors,
}: {
  course: Course | null;
  mentor: Mentor | null;
  catalogCourses: Course[];
  mentors: Mentor[];
}) {
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { shellRef, scale } = useDeviceSceneScale(DEVICE_SCENE_WIDTH, DEVICE_SCENE_HEIGHT);

  const mentorsBySlug = useMemo(
    () => new Map(mentors.map((item) => [item.slug, item])),
    [mentors],
  );

  const demoCourse = course ?? catalogCourses[0] ?? null;
  const demoMentor =
    mentor ??
    (demoCourse
      ? mentorsBySlug.get(demoCourse.mentorSlug) ?? null
      : null);
  const demoCatalog = catalogCourses.length > 0 ? catalogCourses : demoCourse ? [demoCourse] : [];

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

  const rotateX = useTransform(scrollYProgress, [0, 1], [34, 0]);
  const rotateY = useTransform(scrollYProgress, [0, 1], [-10, 0]);
  const tabletScale = useTransform(scrollYProgress, [0, 1], [0.86, 1]);
  const translateZ = useTransform(scrollYProgress, [0, 1], [-180, 0]);

  if (!demoCourse || demoCourse.modules.length === 0) return null;

  const screenProps = {
    course: demoCourse,
    mentor: demoMentor,
    catalogCourses: demoCatalog,
    mentorsBySlug,
    scrollProgress: scrollYProgress,
    reducedMotion: prefersReducedMotion,
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
      data-course-slug={demoCourse.slug}
    >
      <div ref={scrollTrackRef} className="device-mockup-scroll-track">
        <div className="device-mockup-sticky">
          <div className="container-page device-mockup-sticky__inner">
            <div className="device-mockup-header mx-auto mb-4 max-w-3xl text-center md:mb-6">
              <Reveal>
                <p className="eyebrow-tight mb-4">Belajar fleksibel</p>
              </Reveal>
              <h2 id="device-mockup-heading" className="section-display-title text-foreground">
                <WordReveal
                  as="span"
                  className="inline"
                  text="Belajar sederhana, dimana saja"
                  trigger="inView"
                  delay={0.04}
                />
              </h2>
              <Reveal delay={0.1} className="mt-5">
                <p className="section-copy mx-auto max-w-xl text-base">
                  Scroll katalog, pilih kelas, putar video, tulis catatan — lanjut fullscreen
                  tanpa putus.
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
                      <div className="device-mockup-composition">
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

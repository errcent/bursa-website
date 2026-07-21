"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { CourseCarousel } from "@/components/course-carousel";
import { MentorCarousel } from "@/components/mentor-carousel";
import { WordReveal } from "@/components/motion/word-reveal";
import { Button } from "@/components/ui/button";
import type { Course, Mentor } from "@/lib/types";
import { cn } from "@/lib/utils";

type DiscoverView = "kelas" | "mentor";

const DISCOVER_TAB_EASE = [0.22, 1, 0.36, 1] as const;
const DISCOVER_TAB_TRANSITION = {
  duration: 0.42,
  ease: DISCOVER_TAB_EASE,
} as const;

function getDiscoverPanelMotion(
  view: DiscoverView,
  isActive: boolean,
  reducedMotion: boolean
) {
  if (reducedMotion) {
    return { opacity: isActive ? 1 : 0 };
  }

  if (isActive) {
    return { opacity: 1, x: 0, filter: "blur(0px)" };
  }

  return {
    opacity: 0,
    x: view === "kelas" ? -22 : 22,
    filter: "blur(8px)",
  };
}

const viewMeta = {
  kelas: {
    eyebrow: "Ragam Kelas",
    title: "Banyak jalur, satu platform",
    copy: "Forex, saham, kripto — dari pemula hingga lanjutan. Kurikulum terstruktur dengan level, instrumen, dan pendekatan yang berbeda-beda.",
    guidanceHref: "/panduan-belajar",
    guidanceLabel: "Temukan kelas yang sesuai profilmu",
    tabLabel: "Ragam Kelas",
    icon: GraduationCap,
  },
  mentor: {
    eyebrow: "Ragam Mentor",
    title: "Setiap mentor, pendekatan unik",
    copy: "Scalping, swing, fundamental — mentor di Bursa hadir dengan spesialisasi instrumen, level, dan filosofi risiko yang masing-masing berbeda.",
    guidanceHref: "/panduan-belajar",
    guidanceLabel: "Temukan mentor yang selaras gaya belajarmu",
    tabLabel: "Ragam Mentor",
    icon: Users,
  },
} as const;

interface HomeDiscoverSectionProps {
  courses: Course[];
  mentors: Mentor[];
  totalStudents?: number;
  className?: string;
}

export function HomeDiscoverSection({
  courses,
  mentors,
  totalStudents,
  className,
}: HomeDiscoverSectionProps) {
  const hasKelas = courses.length > 0;
  const hasMentor = mentors.length > 0;

  const [activeView, setActiveView] = useState<DiscoverView>(() =>
    hasKelas ? "kelas" : "mentor"
  );
  const reducedMotion = useReducedMotion() ?? false;

  const showTabs = hasKelas && hasMentor;
  const meta = viewMeta[activeView];
  const studentStat =
    totalStudents !== undefined && totalStudents > 0
      ? `${totalStudents.toLocaleString("id-ID")}+ siswa`
      : null;

  if (!hasKelas && !hasMentor) return null;

  return (
    <div className={cn("home-discover-section relative min-w-0", className)}>
      <div className="discover-shell">
        {showTabs ? (
          <div
            className="discover-segmented"
            role="tablist"
            aria-label="Jelajahi ragam kelas atau mentor"
          >
            {(Object.keys(viewMeta) as DiscoverView[]).map((view) => {
              const tab = viewMeta[view];
              const isActive = activeView === view;
              const TabIcon = tab.icon;

              return (
                <button
                  key={view}
                  type="button"
                  role="tab"
                  id={`discover-tab-${view}`}
                  aria-selected={isActive}
                  aria-controls={`discover-panel-${view}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveView(view)}
                  className={cn(
                    "discover-segmented__item relative",
                    isActive && "discover-segmented__item--active"
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="discover-segment-pill"
                      className="discover-segmented__pill"
                      transition={{ type: "spring", stiffness: 520, damping: 38 }}
                    />
                  ) : null}
                  <span className="relative z-[1] inline-flex items-center gap-2">
                    <TabIcon className="size-4 shrink-0" aria-hidden />
                    <span>{tab.tabLabel}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="discover-shell__header">
          <div className="discover-shell__copy-stack">
            {(Object.keys(viewMeta) as DiscoverView[]).map((view) => {
              const panelMeta = viewMeta[view];
              const isActive = activeView === view;
              const isVisible = view === "kelas" ? hasKelas : hasMentor;
              if (!isVisible) return null;

              return (
                <motion.div
                  key={view}
                  className={cn(
                    "discover-shell__copy col-start-1 row-start-1 min-w-0",
                    !isActive && "pointer-events-none"
                  )}
                  animate={getDiscoverPanelMotion(view, isActive, reducedMotion)}
                  initial={false}
                  transition={DISCOVER_TAB_TRANSITION}
                  style={{ zIndex: isActive ? 2 : 1 }}
                  aria-hidden={!isActive}
                >
                  <p className="eyebrow-tight mb-3">{panelMeta.eyebrow}</p>
                  {isActive ? (
                    <WordReveal
                      as="h2"
                      className="section-display-title text-foreground"
                      text={panelMeta.title}
                      trigger="immediate"
                      delay={0.04}
                    />
                  ) : (
                    <h2 className="section-display-title text-foreground">
                      {panelMeta.title}
                    </h2>
                  )}
                  <p className="section-copy mt-3 max-w-xl text-base leading-relaxed">
                    {panelMeta.copy}
                    {view === "kelas" && studentStat ? (
                      <>
                        {" "}
                        <span className="text-muted-foreground/80">· {studentStat}</span>
                      </>
                    ) : null}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="discover-shell__content">
          <div className="discover-carousel-stage">
            {hasKelas ? (
              <motion.div
                id={showTabs ? "discover-panel-kelas" : undefined}
                role={showTabs ? "tabpanel" : undefined}
                aria-labelledby={showTabs ? "discover-tab-kelas" : undefined}
                className={cn(
                  "discover-carousel-panel col-start-1 row-start-1 min-w-0",
                  activeView !== "kelas" && "pointer-events-none"
                )}
                animate={getDiscoverPanelMotion(
                  "kelas",
                  activeView === "kelas",
                  reducedMotion
                )}
                initial={false}
                transition={DISCOVER_TAB_TRANSITION}
                style={{ zIndex: activeView === "kelas" ? 2 : 1 }}
                aria-hidden={activeView !== "kelas"}
              >
                <CourseCarousel
                  courses={courses}
                  totalStudents={totalStudents}
                  hideHeader
                  hideBookmark
                  discoverMode
                  autoPlayPaused={activeView !== "kelas"}
                />
              </motion.div>
            ) : null}

            {hasMentor ? (
              <motion.div
                id={showTabs ? "discover-panel-mentor" : undefined}
                role={showTabs ? "tabpanel" : undefined}
                aria-labelledby={showTabs ? "discover-tab-mentor" : undefined}
                className={cn(
                  "discover-carousel-panel col-start-1 row-start-1 min-w-0",
                  activeView !== "mentor" && "pointer-events-none"
                )}
                animate={getDiscoverPanelMotion(
                  "mentor",
                  activeView === "mentor",
                  reducedMotion
                )}
                initial={false}
                transition={DISCOVER_TAB_TRANSITION}
                style={{ zIndex: activeView === "mentor" ? 2 : 1 }}
                aria-hidden={activeView !== "mentor"}
              >
                <MentorCarousel
                  mentors={mentors}
                  hideBookmark
                  discoverMode
                  autoPlayPaused={activeView !== "mentor"}
                />
              </motion.div>
            ) : null}
          </div>
        </div>

        <div className="discover-shell__footer">
          <Button
            size="lg"
            className="btn-primary h-11 rounded-full px-7"
            render={<Link href={meta.guidanceHref} />}
          >
            <motion.span
              key={activeView}
              className="inline-flex items-center gap-2"
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: DISCOVER_TAB_EASE }}
            >
              {meta.guidanceLabel}
              <ArrowRight className="size-4" />
            </motion.span>
          </Button>
        </div>
      </div>
    </div>
  );
}

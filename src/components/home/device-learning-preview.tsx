"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, List, StickyNote } from "lucide-react";
import { motion, useMotionValueEvent, type MotionValue } from "motion/react";

import { MentorVideoBar } from "@/components/video/mentor-video-bar";
import { ProtectedVideoPlayer } from "@/components/video/protected-video-player";
import { LessonPreviewThumb } from "@/components/video/lesson-preview-thumb";
import { Progress } from "@/components/ui/progress";
import { computeProgressPercent } from "@/lib/learning/progress";
import { cn } from "@/lib/utils";
import {
  findLessonInCourse,
  isLessonFreePreview,
} from "@/lib/video/lesson-access";
import type { Course, Lesson, Mentor } from "@/lib/types";

const DEMO_NOTE_FULL =
  "<p><strong>Support area 1.0850</strong> — tunggu konfirmasi volume sebelum entry.</p><p>Risk 1% per posisi, stop di bawah swing low terakhir.</p>";

type DeviceLearningPreviewProps = {
  course: Course;
  mentor: Mentor;
  lesson: Lesson;
  completedLessonIds: string[];
  className?: string;
  scrollProgress: MotionValue<number>;
  highlightFullscreenControl?: boolean;
};

function pickDemoLesson(course: Course): Lesson {
  const all = course.modules.flatMap((m) => m.lessons);
  return all[1] ?? all[0]!;
}

export function DeviceLearningPreview({
  course,
  mentor,
  lesson: initialLesson,
  completedLessonIds,
  className,
  scrollProgress,
  highlightFullscreenControl = false,
}: DeviceLearningPreviewProps) {
  const lesson = useMemo(() => pickDemoLesson(course) ?? initialLesson, [course, initialLesson]);

  const [sidebarTab, setSidebarTab] = useState<"list" | "notes">("list");
  const [simulatedFullscreen, setSimulatedFullscreen] = useState(false);
  const [mockupAutoPlay, setMockupAutoPlay] = useState(false);
  const [noteReveal, setNoteReveal] = useState(0);
  const [sidebarScrollY, setSidebarScrollY] = useState(0);
  const [pulseFullscreen, setPulseFullscreen] = useState(highlightFullscreenControl);

  useMotionValueEvent(scrollProgress, "change", (p) => {
    if (p < 0.52) {
      setSidebarTab("list");
      setSimulatedFullscreen(false);
      setMockupAutoPlay(false);
      setNoteReveal(0);
      setSidebarScrollY(Math.max(0, Math.round(((p - 0.42) / 0.1) * 88)));
      setPulseFullscreen(false);
      return;
    }

    if (p < 0.62) {
      setSidebarTab("list");
      setSimulatedFullscreen(false);
      setMockupAutoPlay(true);
      setNoteReveal(0);
      setSidebarScrollY(88);
      setPulseFullscreen(false);
      return;
    }

    if (p < 0.78) {
      setSidebarTab("notes");
      setSimulatedFullscreen(false);
      setMockupAutoPlay(true);
      setNoteReveal(Math.min(1, (p - 0.62) / 0.14));
      setSidebarScrollY(88);
      setPulseFullscreen(p >= 0.72);
      return;
    }

    setSidebarTab("notes");
    setSimulatedFullscreen(true);
    setMockupAutoPlay(true);
    setNoteReveal(1);
    setSidebarScrollY(88);
    setPulseFullscreen(false);
  });

  useEffect(() => {
    const p = scrollProgress.get();
    setSidebarScrollY(p < 0.52 ? Math.max(0, Math.round(((p - 0.42) / 0.1) * 88)) : 88);
  }, [scrollProgress]);

  const completed = new Set(completedLessonIds);
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const progressPercent = computeProgressPercent(completed.size, allLessons.length);
  const lessonContext = findLessonInCourse(course, lesson.id);
  const demoNoteHtml = DEMO_NOTE_FULL.slice(0, Math.round(DEMO_NOTE_FULL.length * noteReveal));

  const videoPlayer = (
    <ProtectedVideoPlayer
      courseId={course.slug}
      lessonId={lesson.id}
      lessonTitle={lesson.title}
      durationMinutes={lesson.durationMinutes}
      isPreview={false}
      hasAccess
      mockupMode
      mockupAutoPlay={mockupAutoPlay}
      simulatedFullscreen={simulatedFullscreen}
      highlightFullscreenControl={pulseFullscreen || highlightFullscreenControl}
      userId="device-mockup"
      userEmail="mockup@bursa.local"
      className={simulatedFullscreen ? "h-full min-h-0 flex-1" : undefined}
    />
  );

  return (
    <div
      className={cn(
        "device-learning-preview relative min-h-0 flex-1",
        simulatedFullscreen
          ? "device-learning-preview--fullscreen flex min-h-0 flex-col bg-black"
          : "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]",
        className
      )}
    >
      <div
        className={cn(
          "flex min-h-0 flex-col",
          simulatedFullscreen
            ? "relative z-20 h-full min-h-0 flex-1"
            : "gap-4 border-border p-4 sm:p-6 lg:border-r"
        )}
      >
        <div
          className={cn(
            "mx-auto w-full min-h-0",
            simulatedFullscreen ? "flex h-full min-h-0 flex-1 flex-col" : "max-w-5xl"
          )}
        >
          <div
            className={cn(
              "relative mx-auto w-full min-h-0",
              simulatedFullscreen ? "flex h-full min-h-0 flex-1 flex-col" : undefined
            )}
            style={simulatedFullscreen ? undefined : { maxWidth: "94%" }}
          >
            {videoPlayer}
          </div>
          {!simulatedFullscreen ? <MentorVideoBar mentor={mentor} className="mt-3" /> : null}
        </div>

        {!simulatedFullscreen ? (
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 text-center sm:text-left">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{course.title}</p>
              <h1 className="font-heading text-xl font-medium sm:text-2xl">{lesson.title}</h1>
              {lessonContext ? (
                <p className="mt-1 text-xs text-muted-foreground">{lesson.durationMinutes} menit</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {!simulatedFullscreen ? (
        <aside className="hidden min-h-0 flex-col gap-3 overflow-hidden border-t border-border p-4 sm:p-6 lg:flex lg:border-t-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 rounded-lg border border-border bg-muted/30 p-0.5">
              <span
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium",
                  sidebarTab === "list"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                <List className="size-3.5 shrink-0" />
                Daftar Video
              </span>
              <span
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium",
                  sidebarTab === "notes"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                <StickyNote className="size-3.5 shrink-0" />
                Catatan
              </span>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="[&_[data-slot=progress-indicator]]:bg-foreground" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {completed.size}/{allLessons.length} video selesai.
          </p>
          <div className="min-h-0 flex-1 overflow-hidden">
            {sidebarTab === "list" ? (
              <motion.ul className="flex flex-col gap-1" style={{ y: -sidebarScrollY }}>
                {course.modules.map((module, moduleIndex) =>
                  module.lessons.map((item, lessonIndex) => {
                    const isActive = item.id === lesson.id;
                    const isDone = completed.has(item.id);
                    const isFree = isLessonFreePreview(item, moduleIndex, lessonIndex);
                    return (
                      <li key={item.id}>
                        <div
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-foreground/10 text-foreground ring-1 ring-foreground/15"
                              : "text-muted-foreground"
                          )}
                        >
                          <LessonPreviewThumb
                            title={item.title}
                            isFree={isFree}
                            hasAccess
                            durationMinutes={item.durationMinutes}
                            size="sm"
                          />
                          <span className="flex-1 truncate">{item.title}</span>
                          {isDone ? (
                            <CheckCircle2 className="size-4 shrink-0 text-emerald" />
                          ) : (
                            <Circle className="size-4 shrink-0 opacity-40" />
                          )}
                        </div>
                      </li>
                    );
                  })
                )}
              </motion.ul>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                <div
                  className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border/60 bg-background/80 p-3 text-sm leading-relaxed text-foreground"
                  dangerouslySetInnerHTML={{
                    __html: demoNoteHtml || "<p class='text-muted-foreground'>Tulis catatan…</p>",
                  }}
                />
                <p className="text-[10px] text-muted-foreground">Autosave aktif · demo</p>
              </div>
            )}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

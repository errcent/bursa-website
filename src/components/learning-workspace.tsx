"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Circle,
  Download,
  List,
  StickyNote,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { BookmarkToggleButton } from "@/components/bookmark-toggle-button";
import { LessonQuickActions } from "@/components/lesson-quick-actions";
import { LessonNotesPanel } from "@/components/video/lesson-notes-panel";
import { LessonPreviewThumb } from "@/components/video/lesson-preview-thumb";
import { MentorVideoBar } from "@/components/video/mentor-video-bar";
import { ProtectedVideoPlayer } from "@/components/video/protected-video-player";
import { ResizableVideoStage } from "@/components/video/resizable-video-stage";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { notifyLearningChange } from "@/lib/learning/events";
import { computeProgressPercent } from "@/lib/learning/progress";
import { cn } from "@/lib/utils";
import type { Course, Mentor } from "@/lib/types";
import type { ProtectionViolationType } from "@/lib/video/protection";
import {
  findLessonInCourse,
  getNextLesson,
  isLessonFreePreview,
} from "@/lib/video/lesson-access";
import { enrollUser, isEnrolled } from "@/lib/video/protection";

export function LearningWorkspace({
  course,
  currentLessonId,
  mentor,
}: {
  course: Course;
  currentLessonId: string;
  mentor: Mentor;
}) {
  const { session } = useAuth();
  const allLessons = useMemo(() => course.modules.flatMap((m) => m.lessons), [course]);
  const currentLesson =
    allLessons.find((l) => l.id === currentLessonId) ?? allLessons[0];
  const currentLessonContext = useMemo(
    () => findLessonInCourse(course, currentLesson.id),
    [course, currentLesson.id]
  );

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [progressReady, setProgressReady] = useState(false);
  const [hasCourseAccess, setHasCourseAccess] = useState(false);
  const [playheadSeconds, setPlayheadSeconds] = useState(0);
  const [seekRequestSeconds, setSeekRequestSeconds] = useState<number | null>(null);
  const seekTokenRef = useRef(0);
  const autoCompleteRef = useRef(false);
  const completedModulesBeforeRef = useRef(0);
  const completedRef = useRef(completed);
  completedRef.current = completed;
  const [sidebarTab, setSidebarTab] = useState<"video" | "catatan">("video");
  const [moduleCompleteBanner, setModuleCompleteBanner] = useState<string | null>(null);
  const progressApi = `/api/courses/${course.slug}/progress`;
  const enrollApi = `/api/courses/${course.slug}/enroll`;

  const progressPercent = computeProgressPercent(completed.size, allLessons.length);
  const completedLessonCount = completed.size;
  const isFreePreview = currentLessonContext
    ? isLessonFreePreview(
        currentLesson,
        currentLessonContext.moduleIndex,
        currentLessonContext.lessonIndex
      )
    : currentLesson.preview === true;
  // Guests: preview-only playback. Subscribers: full access (not guest preview mode).
  const isPreview = isFreePreview && !hasCourseAccess;
  const nextLesson = useMemo(
    () => getNextLesson(course, currentLesson.id),
    [course, currentLesson.id]
  );
  const nextLessonContext = useMemo(
    () => (nextLesson ? findLessonInCourse(course, nextLesson.id) : null),
    [course, nextLesson]
  );
  const lessonMaterials = currentLesson.materials ?? [];
  const hasMaterials = lessonMaterials.length > 0;
  const currentLessonNumber = useMemo(() => {
    const index = allLessons.findIndex((lesson) => lesson.id === currentLesson.id);
    return index >= 0 ? index + 1 : 1;
  }, [allLessons, currentLesson.id]);
  const numberedLessonTitle = `${currentLessonNumber}. ${currentLesson.title}`;
  const guidebookHref = hasMaterials
    ? lessonMaterials[0]!.url
    : `/kelas/${course.slug}`;
  const guidebookExternal = guidebookHref.startsWith("http");
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const handleShareLesson = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: numberedLessonTitle,
          text: course.title,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareFeedback("Link disalin");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareFeedback(null);
    }
  }, [course.title, numberedLessonTitle]);

  useEffect(() => {
    if (!shareFeedback) return;
    const timer = window.setTimeout(() => setShareFeedback(null), 2000);
    return () => window.clearTimeout(timer);
  }, [shareFeedback]);

  const seekTo = useCallback((seconds: number) => {
    seekTokenRef.current += 1;
    // Encode a unique token in fractional part so repeated seeks to the same
    // second still trigger the player effect.
    const token = (seekTokenRef.current % 1000) / 1000;
    setSeekRequestSeconds(Math.max(0, Math.floor(seconds)) + token);
    setPlayheadSeconds(Math.max(0, seconds));
  }, []);

  useEffect(() => {
    autoCompleteRef.current = false;
  }, [currentLesson.id]);

  useEffect(() => {
    if (!session?.userId && !session?.email) {
      setCompleted(new Set());
      setProgressReady(true);
      setHasCourseAccess(false);
      return;
    }

    let cancelled = false;
    setProgressReady(false);

    const localEnrolled = session?.userId
      ? isEnrolled(session.userId, course.slug)
      : false;
    setHasCourseAccess(localEnrolled);

    async function loadProgressAndEnrollment() {
      const params = new URLSearchParams({
        ...(session!.userId ? { userId: session!.userId } : {}),
        ...(session!.email ? { email: session!.email } : {}),
      });

      try {
        const [progressRes, enrollRes] = await Promise.all([
          fetch(`${progressApi}?${params}`, {
            cache: "no-store",
            headers: session!.email ? { "x-user-email": session!.email } : {},
          }),
          fetch(`${enrollApi}?${params}`, {
            cache: "no-store",
            headers: session!.email ? { "x-user-email": session!.email } : {},
          }),
        ]);

        if (!cancelled && progressRes.ok) {
          const data = await progressRes.json();
          setCompleted(new Set(data.completedLessonIds ?? []));
          completedModulesBeforeRef.current = data.completedModules ?? 0;
        }

        if (!cancelled && enrollRes.ok) {
          const data = (await enrollRes.json()) as { enrolled?: boolean };
          const serverEnrolled = Boolean(data.enrolled);
          const enrolled = serverEnrolled || localEnrolled;
          setHasCourseAccess(enrolled);
          if (enrolled && session!.userId) {
            enrollUser(session!.userId, course.slug);
          }
          if (localEnrolled && !serverEnrolled && session!.email) {
            const syncRes = await fetch(enrollApi, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-user-email": session!.email,
              },
              body: JSON.stringify({
                email: session!.email,
                userId: session!.userId,
                name: session!.name,
                role: session!.role,
              }),
            });
            if (!cancelled && syncRes.ok) {
              setHasCourseAccess(true);
            }
          }
        }
      } catch {
        if (!cancelled) {
          setCompleted(new Set());
          setHasCourseAccess(localEnrolled);
        }
      } finally {
        if (!cancelled) setProgressReady(true);
      }
    }

    void loadProgressAndEnrollment();
    return () => {
      cancelled = true;
    };
  }, [course.slug, enrollApi, progressApi, session]);

  const handleProtectionViolation = useCallback(
    (type: ProtectionViolationType, lessonId: string) => {
      console.info("[audit] Pelanggaran proteksi video", {
        type,
        lessonId,
        courseId: course.slug,
        userId: session?.userId ?? "anonymous",
        timestamp: new Date().toISOString(),
      });
    },
    [course.slug, session?.userId]
  );

  async function syncLessonProgress(
    id: string,
    nextCompleted: boolean,
    watchedSeconds?: number
  ) {
    const previousCompleted = new Set(completed);

    setCompleted((prev) => {
      const next = new Set(prev);
      if (nextCompleted) next.add(id);
      else next.delete(id);
      return next;
    });

    if (!session?.userId && !session?.email) {
      setModuleCompleteBanner("Masuk untuk menyimpan progres belajar.");
      return;
    }

    try {
      const res = await fetch(progressApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session.email ? { "x-user-email": session.email } : {}),
        },
        body: JSON.stringify({
          userId: session.userId ?? "guest",
          email: session.email,
          lessonId: id,
          completed: nextCompleted,
          ...(watchedSeconds !== undefined ? { watchedSeconds } : {}),
        }),
      });

      if (!res.ok) {
        setCompleted(previousCompleted);
        return;
      }

      const data = await res.json();
      if (Array.isArray(data.completedLessonIds)) {
        setCompleted(new Set(data.completedLessonIds as string[]));
      }

      const modules = data.modules as
        | { title: string; isComplete: boolean }[]
        | undefined;
      const completedModulesNow = (data.completedModules as number | undefined) ?? 0;

      if (
        nextCompleted &&
        completedModulesNow > completedModulesBeforeRef.current &&
        modules
      ) {
        const completeModules = modules.filter((module) => module.isComplete);
        const bannerModule = completeModules[completeModules.length - 1];
        if (bannerModule) {
          setModuleCompleteBanner("Lanjutkan ke video berikutnya.");
        }
      }
      completedModulesBeforeRef.current = completedModulesNow;
      notifyLearningChange();
    } catch {
      setCompleted(previousCompleted);
    }
  }

  async function toggleCompleted(id: string) {
    await syncLessonProgress(id, !completed.has(id));
  }

  const handleVideoTimeUpdate = useCallback(
    (seconds: number) => {
      setPlayheadSeconds(seconds);

      if (
        autoCompleteRef.current ||
        completedRef.current.has(currentLesson.id) ||
        !session?.email
      ) {
        return;
      }

      const durationSeconds = Math.max(currentLesson.durationMinutes * 60, 1);
      if (seconds / durationSeconds < 0.9) return;

      autoCompleteRef.current = true;
      void syncLessonProgress(currentLesson.id, true, Math.floor(seconds));
    },
    [currentLesson.durationMinutes, currentLesson.id, session?.email]
  );

  const lessonList = (
    <ul className="flex flex-col gap-1">
      {(() => {
        let lessonNumber = 0;
        return course.modules.map((module, moduleIndex) =>
          module.lessons.map((lesson, lessonIndex) => {
            lessonNumber += 1;
            const isActive = lesson.id === currentLesson.id;
            const isDone = completed.has(lesson.id);
            const isFree = isLessonFreePreview(lesson, moduleIndex, lessonIndex);
            return (
              <li key={lesson.id}>
                <Link
                  href={`/belajar/${course.slug}/${lesson.id}`}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <LessonPreviewThumb
                    title={lesson.title}
                    isFree={isFree}
                    hasAccess={hasCourseAccess}
                    durationMinutes={lesson.durationMinutes}
                    size="sm"
                  />
                  <span className="flex-1 truncate">
                    {lessonNumber}. {lesson.title}
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald" />
                  ) : (
                    <Circle className="size-4 shrink-0 opacity-40" />
                  )}
                </Link>
              </li>
            );
          })
        );
      })()}
    </ul>
  );

  const sidebarPanel = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 rounded-lg border border-border bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => setSidebarTab("video")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              sidebarTab === "video"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-3.5 shrink-0" />
            Daftar Video
          </button>
          <button
            type="button"
            onClick={() => setSidebarTab("catatan")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              sidebarTab === "catatan"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <StickyNote className="size-3.5 shrink-0" />
            Catatan
          </button>
        </div>
        {sidebarTab === "video" && (
          <span className="shrink-0 text-xs text-muted-foreground">{progressPercent}%</span>
        )}
      </div>

      {sidebarTab === "video" ? (
        <>
          <Progress
            value={progressPercent}
            className="[&_[data-slot=progress-indicator]]:bg-foreground"
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {completedLessonCount}/{allLessons.length} video selesai.
          </p>
          <div className="min-h-0 max-h-[min(24rem,52vh)] overflow-y-auto lg:max-h-none lg:flex-1">
            {lessonList}
          </div>
        </>
      ) : (
        <div className="flex min-h-0 max-h-[min(24rem,52vh)] flex-1 flex-col overflow-hidden lg:max-h-none">
          <LessonNotesPanel
            courseSlug={course.slug}
            courseTitle={course.title}
            lessonId={currentLesson.id}
            lessonTitle={currentLesson.title}
            variant="sidebar"
          />
        </div>
      )}
    </>
  );

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_minmax(0,1fr)]">
      <div className="flex flex-col gap-4 border-border p-4 sm:p-6 lg:col-start-1 lg:row-start-1 lg:border-r">
        <div className="mx-auto w-full max-w-5xl">
          <ResizableVideoStage>
            <ProtectedVideoPlayer
              courseId={course.slug}
              lessonId={currentLesson.id}
              lessonTitle={currentLesson.title}
              durationMinutes={currentLesson.durationMinutes}
              isPreview={isPreview}
              hasAccess={hasCourseAccess}
              userId={session?.userId}
              userEmail={session?.email}
              seekRequestSeconds={seekRequestSeconds}
              onTimeUpdate={handleVideoTimeUpdate}
              onProtectionViolation={handleProtectionViolation}
            />
          </ResizableVideoStage>

          {mentor ? <MentorVideoBar mentor={mentor} className="mt-3 hidden md:flex" /> : null}

          <LessonQuickActions
            onShare={() => void handleShareLesson()}
            shareFeedback={shareFeedback}
            guidebookHref={guidebookHref}
            guidebookExternal={guidebookExternal}
            courseSlug={course.slug}
          />
        </div>

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1.5 text-left">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-xl font-medium sm:text-2xl">{numberedLessonTitle}</h1>
              {mentor ? (
                <p className="mt-1 text-sm text-muted-foreground md:hidden">
                  dengan{" "}
                  <Link
                    href={`/instruktur/${mentor.slug}`}
                    className="text-foreground underline-offset-2 hover:underline"
                  >
                    {mentor.name}
                  </Link>
                </p>
              ) : null}
            </div>
            <BookmarkToggleButton
              bookmarkRef={{
                type: "lesson",
                courseSlug: course.slug,
                lessonId: currentLesson.id,
              }}
              className="hidden opacity-100 md:inline-flex"
            />
          </div>
        </div>
      </div>

      <aside className="flex flex-col border-t border-border p-4 sm:p-6 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:min-h-0 lg:overflow-hidden lg:border-t-0 lg:border-l">
        <div className="flex min-h-0 flex-1 flex-col gap-3">{sidebarPanel}</div>
      </aside>

      <div className="flex flex-col gap-4 border-border p-4 pt-0 sm:p-6 sm:pt-0 lg:col-start-1 lg:row-start-2 lg:border-r lg:pb-6">
        {nextLesson && nextLessonContext && (
          <section className="mx-auto w-full max-w-5xl">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Video Berikutnya
            </h2>
            <Link
              href={`/belajar/${course.slug}/${nextLesson.id}`}
              className="group flex gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-foreground/20 hover:bg-muted/30"
            >
              <LessonPreviewThumb
                title={nextLesson.title}
                isFree={isLessonFreePreview(
                  nextLesson,
                  nextLessonContext.moduleIndex,
                  nextLessonContext.lessonIndex
                )}
                hasAccess={hasCourseAccess}
                durationMinutes={nextLesson.durationMinutes}
                size="md"
                showPlayOverlay={
                  hasCourseAccess ||
                  isLessonFreePreview(
                    nextLesson,
                    nextLessonContext.moduleIndex,
                    nextLessonContext.lessonIndex
                  )
                }
              />
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <p className="line-clamp-2 text-sm font-medium leading-snug">
                  {nextLesson.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {nextLesson.durationMinutes} menit ·{" "}
                  {hasCourseAccess
                    ? "Termasuk dalam langganan Anda"
                    : isLessonFreePreview(
                          nextLesson,
                          nextLessonContext.moduleIndex,
                          nextLessonContext.lessonIndex
                        )
                      ? "Preview gratis tersedia"
                      : "Konten berbayar — preview dibatasi"}
                </p>
              </div>
            </Link>
          </section>
        )}

        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="btn-primary"
            disabled={!progressReady}
            onClick={() => void toggleCompleted(currentLesson.id)}
          >
            <Check className="size-4" />
            {completed.has(currentLesson.id) ? "Selesai Ditandai" : "Tandai Selesai & Lanjut"}
          </Button>
          <Button size="sm" variant="outline" render={<Link href={`/kelas/${course.slug}`} />}>
            Kembali ke Detail Kelas
          </Button>
          {progressReady && hasCourseAccess ? (
            <span className="rounded-full border border-emerald/25 bg-emerald/10 px-2.5 py-1 text-[11px] font-medium text-emerald">
              Sudah berlangganan
            </span>
          ) : progressReady && !hasCourseAccess && !isFreePreview ? (
            <Button size="sm" className="btn-primary" render={<Link href={`/checkout/${course.slug}`} />}>
              Checkout untuk akses penuh
            </Button>
          ) : null}
        </div>

        {moduleCompleteBanner && (
          <div className="mx-auto w-full max-w-5xl rounded-lg border border-emerald/20 bg-emerald/5 px-4 py-3 text-xs text-muted-foreground">
            {moduleCompleteBanner}
          </div>
        )}

        {hasMaterials ? (
          <div className="mx-auto mt-2 w-full max-w-5xl">
            <ul className="flex flex-col gap-2">
              {lessonMaterials.map((material) => (
                <li key={material.id}>
                  <a
                    href={material.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted/30"
                  >
                    <Download className="size-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{material.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

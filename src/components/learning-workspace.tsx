"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Circle,
  Download,
  List,
  MessageSquare,
  StickyNote,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { LessonNotesPanel } from "@/components/video/lesson-notes-panel";
import { LessonQaPanel } from "@/components/video/lesson-qa-panel";
import { LessonPreviewThumb } from "@/components/video/lesson-preview-thumb";
import { MentorVideoBar } from "@/components/video/mentor-video-bar";
import { ProtectedVideoPlayer } from "@/components/video/protected-video-player";
import { ResizableVideoStage } from "@/components/video/resizable-video-stage";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMentorBySlug } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { Course } from "@/lib/types";
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
}: {
  course: Course;
  currentLessonId: string;
}) {
  const { session } = useAuth();
  const mentor = useMemo(() => getMentorBySlug(course.mentorSlug), [course.mentorSlug]);
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
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [mobileLessonOpen, setMobileLessonOpen] = useState(false);
  const [moduleCompleteBanner, setModuleCompleteBanner] = useState<string | null>(null);
  const progressApi = `/api/courses/${course.slug}/progress`;
  const enrollApi = `/api/courses/${course.slug}/enroll`;

  const progressPercent = Math.round((completed.size / allLessons.length) * 100);
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

  const seekTo = useCallback((seconds: number) => {
    seekTokenRef.current += 1;
    // Encode a unique token in fractional part so repeated seeks to the same
    // second still trigger the player effect.
    const token = (seekTokenRef.current % 1000) / 1000;
    setSeekRequestSeconds(Math.max(0, Math.floor(seconds)) + token);
    setPlayheadSeconds(Math.max(0, seconds));
  }, []);

  useEffect(() => {
    if (!session?.userId) {
      setCompleted(new Set());
      setProgressReady(true);
      setHasCourseAccess(false);
      return;
    }

    let cancelled = false;
    setProgressReady(false);

    // Optimistic local/demo enrollment while DB check loads.
    const localEnrolled = isEnrolled(session.userId, course.slug);
    setHasCourseAccess(localEnrolled);

    async function loadProgressAndEnrollment() {
      const params = new URLSearchParams({
        userId: session!.userId,
        ...(session!.email ? { email: session!.email } : {}),
      });

      try {
        const [progressRes, enrollRes] = await Promise.all([
          fetch(`${progressApi}?${params}`, { cache: "no-store" }),
          fetch(`${enrollApi}?${params}`, {
            cache: "no-store",
            headers: session!.email ? { "x-user-email": session!.email } : {},
          }),
        ]);

        if (!cancelled && progressRes.ok) {
          const data = await progressRes.json();
          setCompleted(new Set(data.completedLessonIds ?? []));
        }

        if (!cancelled && enrollRes.ok) {
          const data = (await enrollRes.json()) as { enrolled?: boolean };
          const serverEnrolled = Boolean(data.enrolled);
          const enrolled = serverEnrolled || localEnrolled;
          setHasCourseAccess(enrolled);
          if (enrolled) {
            enrollUser(session!.userId, course.slug);
          }
          // Local demo enroll without Prisma row (pre-bridge checkout) — sync
          // Enrollment + mentor hub membership so komunitas shows the hub.
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

  async function toggleCompleted(id: string) {
    const nextCompleted = !completed.has(id);

    setCompleted((prev) => {
      const next = new Set(prev);
      if (nextCompleted) next.add(id);
      else next.delete(id);
      return next;
    });

    if (!session?.userId) {
      setModuleCompleteBanner(
        "Masuk untuk menyimpan progres dan membuka akses rating & ulasan setelah modul selesai."
      );
      return;
    }

    try {
      const res = await fetch(progressApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.userId,
          email: session.email,
          lessonId: id,
          completed: nextCompleted,
        }),
      });

      if (!res.ok) return;
      const data = await res.json();
      const newlyComplete = (
        data.modules as { title: string; isComplete: boolean }[] | undefined
      )?.find((module) => module.isComplete);
      if (nextCompleted && newlyComplete && data.completedModules > 0) {
        setModuleCompleteBanner(
          `Modul "${newlyComplete.title}" selesai. Kamu sekarang bisa memberi rating & ulasan di halaman kelas.`
        );
      }
    } catch {
      // Keep optimistic local state if sync fails.
    }
  }

  const lessonList = (
    <div className="flex flex-col gap-1">
      {course.modules.map((module, moduleIndex) => {
        const moduleDone =
          module.lessons.length > 0 && module.lessons.every((l) => completed.has(l.id));
        return (
          <div key={module.title} className="mb-2">
            <p className="mb-1 flex items-center gap-1.5 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {module.title}
              {moduleDone && <CheckCircle2 className="size-3.5 text-emerald" />}
            </p>
            <ul className="flex flex-col gap-1">
              {module.lessons.map((lesson, lessonIndex) => {
                const isActive = lesson.id === currentLesson.id;
                const isDone = completed.has(lesson.id);
                const isFree = isLessonFreePreview(lesson, moduleIndex, lessonIndex);
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/belajar/${course.slug}/${lesson.id}`}
                      onClick={() => setMobileLessonOpen(false)}
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
                      <span className="flex-1 truncate">{lesson.title}</span>
                      {isDone ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald" />
                      ) : (
                        <Circle className="size-4 shrink-0 opacity-40" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      className={cn(
        "grid flex-1 grid-cols-1 gap-0 transition-[grid-template-columns] duration-300",
        videoExpanded ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_300px]"
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4 border-border p-4 sm:p-6",
          !videoExpanded && "lg:border-r"
        )}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 text-center sm:text-left">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {course.title}
            </p>
            <h1 className="font-heading text-xl font-medium sm:text-2xl">
              {currentLesson.title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Sheet open={mobileLessonOpen} onOpenChange={setMobileLessonOpen}>
              <SheetTrigger
                render={
                  <Button size="sm" variant="outline" className="gap-1.5 lg:hidden" />
                }
              >
                <List className="size-3.5" />
                Daftar Lesson
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Progres Kelas · {progressPercent}%</SheetTitle>
                </SheetHeader>
                <Progress
                  value={progressPercent}
                  className="mb-3 [&_[data-slot=progress-indicator]]:bg-foreground"
                />
                {lessonList}
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl">
          <ResizableVideoStage
            expanded={videoExpanded}
            onExpandedChange={setVideoExpanded}
          >
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
              onTimeUpdate={setPlayheadSeconds}
              onProtectionViolation={handleProtectionViolation}
            />
          </ResizableVideoStage>
          {mentor ? <MentorVideoBar mentor={mentor} className="mt-3" /> : null}
        </div>

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
              />
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <p className="text-xs text-muted-foreground">{nextLessonContext.module.title}</p>
                <p className="line-clamp-2 text-sm font-medium leading-snug">
                  {nextLesson.title}
                </p>
                <p className="text-xs text-muted-foreground">
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
            {moduleCompleteBanner}{" "}
            <Link href={`/kelas/${course.slug}#ulasan`} className="underline">
              Buka rating & ulasan
            </Link>
          </div>
        )}

        <Tabs defaultValue="catatan" className="mx-auto mt-2 w-full max-w-5xl">
          <TabsList className="w-full overflow-x-auto">
            <TabsTrigger value="catatan">
              <StickyNote className="size-3.5" /> Catatan
            </TabsTrigger>
            <TabsTrigger value="materi">
              <Download className="size-3.5" /> Materi
            </TabsTrigger>
            <TabsTrigger value="qa">
              <MessageSquare className="size-3.5" /> Komentar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catatan" className="mt-4">
            <LessonNotesPanel
              courseSlug={course.slug}
              courseTitle={course.title}
              lessonId={currentLesson.id}
              lessonTitle={currentLesson.title}
              playheadSeconds={playheadSeconds}
              onSeek={seekTo}
            />
          </TabsContent>

          <TabsContent value="materi" className="mt-4">
            <p className="text-sm text-muted-foreground">
              Belum ada materi unduhan untuk lesson ini. Mentor dapat mengunggah PDF, template,
              atau cheat sheet dari dashboard mentor.
            </p>
          </TabsContent>

          <TabsContent value="qa" className="mt-4">
            <LessonQaPanel
              courseSlug={course.slug}
              lessonId={currentLesson.id}
              playheadSeconds={playheadSeconds}
              onSeek={seekTo}
            />
          </TabsContent>
        </Tabs>
      </div>

      {!videoExpanded && (
        <aside className="hidden flex-col gap-3 border-t border-border p-4 sm:p-6 lg:flex lg:border-t-0">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-medium">Progres Kelas</h2>
            <span className="text-xs text-muted-foreground">{progressPercent}%</span>
          </div>
          <Progress
            value={progressPercent}
            className="[&_[data-slot=progress-indicator]]:bg-foreground"
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Selesaikan satu modul penuh untuk membuka rating & ulasan kelas.
          </p>

          <div className="mt-2">{lessonList}</div>
        </aside>
      )}
    </div>
  );
}

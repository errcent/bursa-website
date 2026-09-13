"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  List,
  Maximize2,
  Minimize2,
  StickyNote,
} from "lucide-react";

import {
  LearningSidebarResizeHandle,
  useLearningSidebarWidth,
} from "@/components/learning/learning-sidebar-resize";
import { useMobileLearningPip } from "@/components/learning/mobile-learning-pip-provider";
import { MobileLessonMiniPlayerShell } from "@/components/learning/mobile-lesson-mini-player";
import { useVisualViewportCssVars } from "@/lib/hooks/use-visual-viewport-layout";
import { resolveBelajarReturnPath } from "@/lib/learning/belajar-return-path";
import type { VideoPlayerHandle } from "@/lib/video/video-player-handle";

import { useAuth } from "@/components/auth-provider";
import { BookmarkToggleButton } from "@/components/bookmark-toggle-button";
import { LessonQuickActions } from "@/components/lesson-quick-actions";
import { LessonNotesPanel } from "@/components/video/lesson-notes-panel";
import { LessonPreviewThumb } from "@/components/video/lesson-preview-thumb";
import { ProtectedVideoPlayer } from "@/components/video/protected-video-player";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { notifyLearningChange } from "@/lib/learning/events";
import {
  loadGlobalGuestCompletedKeys,
  loadGuestProgress,
  loadGuestVerifiedSeconds,
  mergeCourseGuestProgress,
  rememberGlobalGuestCompletion,
  saveGuestProgress,
  saveGuestVerifiedSeconds,
} from "@/lib/learning/guest-progress-storage";
import { formatModuleTitle } from "@/lib/learning/module-title";
import { lessonProgressKey } from "@/lib/learning/lesson-progress-key";
import {
  isItemPlayable,
  itemHref,
} from "@/components/playlist/playlist-item-utils";
import type { PlaylistDetail } from "@/lib/playlist/types";
import { computeProgressPercent } from "@/lib/learning/progress";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";
import type { Course, Mentor } from "@/lib/types";
import type { ProtectionViolationType } from "@/lib/video/protection";
import {
  computeHeartbeatCredit,
  watchCompletionThresholdSeconds,
} from "@/lib/video/watch-credit";
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
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const playlistSlug = searchParams.get("playlist")?.trim() || null;
  const returnPath = useMemo(
    () => resolveBelajarReturnPath(course.slug, searchParams),
    [course.slug, searchParams]
  );
  const pip = useMobileLearningPip();
  const dockNavigatedRef = useRef(false);
  const allLessons = useMemo(() => course.modules.flatMap((m) => m.lessons), [course]);
  const currentLesson =
    allLessons.find((l) => l.id === currentLessonId) ?? allLessons[0];
  const currentLessonContext = useMemo(
    () => findLessonInCourse(course, currentLesson.id),
    [course, currentLesson.id]
  );
  const lessonDescription =
    currentLesson.description?.trim() || course.shortDescription?.trim() || "";

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [progressReady, setProgressReady] = useState(false);
  const [hasCourseAccess, setHasCourseAccess] = useState(false);
  const seekRequestSeconds = null;
  const autoCompleteRef = useRef(false);
  const watchTrackerRef = useRef({
    verified: 0,
    position: 0,
    lastAt: null as Date | null,
  });
  const [verifiedSecondsByLesson, setVerifiedSecondsByLesson] = useState<
    Record<string, number>
  >({});
  const completedModulesBeforeRef = useRef(0);
  const completedRef = useRef(completed);
  completedRef.current = completed;
  const [sidebarTab, setSidebarTab] = useState<"video" | "catatan">("video");
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [mobileCollapse, setMobileCollapse] = useState(0);
  const [mobileVideoChromeVisible, setMobileVideoChromeVisible] = useState(true);
  const [mobilePlayback, setMobilePlayback] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: currentLesson.durationMinutes * 60,
  });
  const playerRef = useRef<VideoPlayerHandle>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const mobileNotesStudio = isMobileLayout && sidebarTab === "catatan";
  useVisualViewportCssVars(layoutRef, mobileNotesStudio);

  useEffect(() => {
    router.prefetch(returnPath);
  }, [router, returnPath]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobileLayout(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const { width: sidebarWidth, widthRef: sidebarWidthRef, applyWidth, persist } =
    useLearningSidebarWidth(sidebarTab === "catatan");
  const progressApi = `/api/courses/${course.slug}/progress`;
  const enrollApi = `/api/courses/${course.slug}/enroll`;

  const isFreePreview = currentLessonContext
    ? isLessonFreePreview(
        currentLesson,
        currentLessonContext.moduleIndex,
        currentLessonContext.lessonIndex
      )
    : currentLesson.preview === true;
  const isPreview = isFreePreview && !hasCourseAccess;

  const isLessonAccessible = useCallback(
    (lessonId: string) => {
      const ctx = findLessonInCourse(course, lessonId);
      if (!ctx) return false;
      return (
        hasCourseAccess ||
        isLessonFreePreview(ctx.lesson, ctx.moduleIndex, ctx.lessonIndex)
      );
    },
    [course, hasCourseAccess]
  );

  const sanitizeCompleted = useCallback(
    (ids: Iterable<string>) => {
      const next = new Set<string>();
      for (const id of ids) {
        if (isLessonAccessible(id)) next.add(id);
      }
      return next;
    },
    [isLessonAccessible]
  );

  const canTrackProgress = isLessonAccessible(currentLesson.id);
  const nextLesson = useMemo(
    () => getNextLesson(course, currentLesson.id),
    [course, currentLesson.id]
  );
  const firstPreviewLessonHref = useMemo(() => {
    for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex++) {
      const courseModule = course.modules[moduleIndex];
      for (let lessonIndex = 0; lessonIndex < courseModule.lessons.length; lessonIndex++) {
        const lesson = courseModule.lessons[lessonIndex];
        if (isLessonFreePreview(lesson, moduleIndex, lessonIndex)) {
          return `/belajar/${course.slug}/${lesson.id}`;
        }
      }
    }
    return undefined;
  }, [course]);
  const lessonMaterials = currentLesson.materials ?? [];
  const hasMaterials = lessonMaterials.length > 0;
  const guidebookHref = hasMaterials ? lessonMaterials[0]!.url : undefined;
  const guidebookExternal = Boolean(guidebookHref?.startsWith("http"));
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [playlistContext, setPlaylistContext] = useState<PlaylistDetail | null>(null);
  const [playlistCompletedKeys, setPlaylistCompletedKeys] = useState<Set<string>>(
    () => new Set()
  );

  const playlistLessonItems = useMemo(
    () =>
      playlistContext?.items.filter(
        (item) => item.courseSlug && item.lessonLegacyId && isItemPlayable(item.accessStatus)
      ) ?? [],
    [playlistContext?.items]
  );

  const courseLessonTotal = playlistSlug
    ? Math.max(playlistLessonItems.length, 1)
    : allLessons.length;
  const completedLessonCount = playlistSlug
    ? playlistLessonItems.filter((item) =>
        playlistCompletedKeys.has(
          lessonProgressKey(item.courseSlug!, item.lessonLegacyId!)
        )
      ).length
    : completed.size;
  const progressPercent = computeProgressPercent(completedLessonCount, courseLessonTotal);

  const isCurrentDone =
    canTrackProgress &&
    (playlistSlug
      ? playlistCompletedKeys.has(
          lessonProgressKey(course.slug, currentLesson.id)
        ) || completed.has(currentLesson.id)
      : completed.has(currentLesson.id));

  const nextLessonHref = nextLesson ? `/belajar/${course.slug}/${nextLesson.id}` : null;

  const nextPlaylistHref = useMemo(() => {
    if (!playlistSlug || playlistLessonItems.length === 0) return null;
    const index = playlistLessonItems.findIndex(
      (item) =>
        item.courseSlug === course.slug && item.lessonLegacyId === currentLesson.id
    );
    if (index < 0 || index >= playlistLessonItems.length - 1) return null;
    return itemHref(playlistLessonItems[index + 1]!, playlistSlug);
  }, [course.slug, currentLesson.id, playlistLessonItems, playlistSlug]);

  const continueHref = playlistSlug ? nextPlaylistHref : nextLessonHref;

  const handleShareLesson = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: currentLesson.title,
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
  }, [course.title, currentLesson.title]);

  useEffect(() => {
    if (!shareFeedback) return;
    const timer = window.setTimeout(() => setShareFeedback(null), 2000);
    return () => window.clearTimeout(timer);
  }, [shareFeedback]);

  useEffect(() => {
    autoCompleteRef.current = false;
  }, [currentLesson.id]);

  useEffect(() => {
    if (!playlistSlug) {
      setPlaylistContext(null);
      return;
    }
    let cancelled = false;
    async function loadPlaylist() {
      try {
        const res = await fetch(`/api/playlists/${encodeURIComponent(playlistSlug!)}`, {
          cache: "no-store",
          credentials: "include",
          headers: session?.email ? { "x-user-email": session.email } : {},
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { playlist?: PlaylistDetail };
        if (!data.playlist || cancelled) return;
        setPlaylistContext(data.playlist);
        const keys = new Set(data.playlist.completedLessonKeys ?? []);
        for (const key of loadGlobalGuestCompletedKeys()) keys.add(key);
        setPlaylistCompletedKeys(keys);
      } catch {
        if (!cancelled) setPlaylistContext(null);
      }
    }
    void loadPlaylist();
    return () => {
      cancelled = true;
    };
  }, [playlistSlug, session?.email]);

  useEffect(() => {
    if (!session?.userId && !session?.email) {
      const guest = sanitizeCompleted(
        mergeCourseGuestProgress(
          course.slug,
          allLessons.map((l) => l.id),
          loadGuestProgress(course.slug)
        )
      );
      setCompleted(guest);
      saveGuestProgress(course.slug, guest);
      if (playlistSlug) {
        setPlaylistCompletedKeys(loadGlobalGuestCompletedKeys());
      }
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
          setCompleted(sanitizeCompleted(data.completedLessonIds ?? []));
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
  }, [course.slug, enrollApi, progressApi, sanitizeCompleted, session]);

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
    if (nextCompleted && !isLessonAccessible(id)) {
      return false;
    }

    const previousCompleted = new Set(completed);
    const next = new Set(completed);
    if (nextCompleted) next.add(id);
    else next.delete(id);
    setCompleted(next);

    if (!session?.userId && !session?.email) {
      saveGuestProgress(course.slug, next);
      rememberGlobalGuestCompletion(course.slug, id);
      setPlaylistCompletedKeys((prev) => {
        const keys = new Set(prev);
        const key = lessonProgressKey(course.slug, id);
        if (nextCompleted) keys.add(key);
        else keys.delete(key);
        return keys;
      });
      return true;
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
        return false;
      }

      const data = await res.json();
      if (Array.isArray(data.completedLessonIds)) {
        setCompleted(sanitizeCompleted(data.completedLessonIds as string[]));
      }

      completedModulesBeforeRef.current =
        (data.completedModules as number | undefined) ?? 0;
      setPlaylistCompletedKeys((prev) => {
        const keys = new Set(prev);
        const key = lessonProgressKey(course.slug, id);
        if (nextCompleted) keys.add(key);
        else keys.delete(key);
        return keys;
      });
      notifyLearningChange();
      return true;
    } catch {
      setCompleted(previousCompleted);
      return false;
    }
  }

  const lessonDurationSeconds = Math.max(currentLesson.durationMinutes * 60, 1);

  const getLessonWatchRatio = useCallback(
    (lessonId: string, durationMinutes: number) => {
      if (completed.has(lessonId)) return 1;
      const durationSec = Math.max(durationMinutes * 60, 1);
      const verified = verifiedSecondsByLesson[lessonId] ?? 0;
      return Math.min(1, verified / durationSec);
    },
    [completed, verifiedSecondsByLesson]
  );

  const tryAutoCompleteLesson = useCallback(
    (lessonId: string, watchedSeconds: number) => {
      if (
        autoCompleteRef.current ||
        completedRef.current.has(lessonId) ||
        !canTrackProgress
      ) {
        return;
      }
      autoCompleteRef.current = true;
      void syncLessonProgress(lessonId, true, watchedSeconds);
    },
    [canTrackProgress]
  );

  const handleWatchCompletionEligible = useCallback(() => {
    tryAutoCompleteLesson(currentLesson.id, Math.floor(lessonDurationSeconds * 0.8));
  }, [currentLesson.id, lessonDurationSeconds, tryAutoCompleteLesson]);

  const handleVideoTimeUpdate = useCallback(
    (seconds: number) => {
      setMobilePlayback((prev) => {
        const fromRef = playerRef.current?.getPlaybackState();
        return {
          isPlaying: fromRef?.isPlaying ?? prev.isPlaying,
          currentTime: seconds,
          duration: fromRef?.duration ?? prev.duration,
        };
      });

      if (!canTrackProgress || completedRef.current.has(currentLesson.id)) return;

      const useClientWatchCredit =
        isPreview || !session?.userId || !hasCourseAccess;

      if (!useClientWatchCredit) return;

      const tracker = watchTrackerRef.current;
      const credit = computeHeartbeatCredit({
        previousVerified: tracker.verified,
        previousPosition: tracker.position,
        lastHeartbeatAt: tracker.lastAt,
        position: seconds,
        durationSeconds: lessonDurationSeconds,
      });
      tracker.verified = credit.verifiedWatchedSeconds;
      tracker.position = credit.heartbeatPosition;
      tracker.lastAt = new Date();

      setVerifiedSecondsByLesson((prev) => ({
        ...prev,
        [currentLesson.id]: credit.verifiedWatchedSeconds,
      }));

      if (!session?.userId && !session?.email) {
        saveGuestVerifiedSeconds(
          course.slug,
          currentLesson.id,
          credit.verifiedWatchedSeconds,
          completedRef.current
        );
      }

      const threshold = watchCompletionThresholdSeconds(lessonDurationSeconds);
      if (credit.verifiedWatchedSeconds >= threshold) {
        tryAutoCompleteLesson(currentLesson.id, credit.verifiedWatchedSeconds);
      }
    },
    [
      canTrackProgress,
      course.slug,
      currentLesson.id,
      hasCourseAccess,
      isPreview,
      lessonDurationSeconds,
      session?.email,
      session?.userId,
      tryAutoCompleteLesson,
    ]
  );

  useEffect(() => {
    setMobilePlayback((prev) => ({
      ...prev,
      duration: currentLesson.durationMinutes * 60,
      currentTime: 0,
    }));
    setMobileCollapse(0);
    dockNavigatedRef.current = false;
    autoCompleteRef.current = false;
    watchTrackerRef.current = { verified: 0, position: 0, lastAt: null };
    const guestVerified = loadGuestVerifiedSeconds(course.slug);
    const restored = guestVerified[currentLesson.id] ?? 0;
    watchTrackerRef.current.verified = restored;
    setVerifiedSecondsByLesson((prev) => ({ ...prev, ...guestVerified }));
    pip.dismiss();
    setMobileVideoChromeVisible(true);
  }, [course.slug, currentLesson.id, currentLesson.durationMinutes, pip]);

  const navigateBackFromLesson = useCallback(() => {
    if (dockNavigatedRef.current) {
      router.replace(returnPath);
      return;
    }
    dockNavigatedRef.current = true;

    const query = searchParams.toString();
    const lessonHref = query ? `${pathname}?${query}` : pathname;
    const video = playerRef.current?.getVideoElement() ?? null;

    router.replace(returnPath);

    void pip.enterDetached({
      lessonHref,
      returnPath,
      courseTitle: course.title,
      video,
    });
  }, [course.title, pathname, pip, returnPath, router, searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 1023px)").matches) return;

    if (mobileCollapse < 0.96) {
      if (mobileCollapse < 0.85) {
        dockNavigatedRef.current = false;
      }
      return;
    }
    navigateBackFromLesson();
  }, [mobileCollapse, navigateBackFromLesson]);

  async function handleContinue() {
    if (!canTrackProgress || !isCurrentDone) return;
    if (continueHref) {
      router.push(continueHref);
    }
  }

  const playlistLessonList =
    playlistSlug && playlistContext ? (
      <div className="flex min-w-0 flex-col gap-2">
        <p className="px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
          Playlist
        </p>
        <p className="px-1 text-xs font-medium leading-snug text-foreground/90 line-clamp-2">
          {playlistContext.title}
        </p>
        <ul className="mt-1 flex flex-col gap-0.5">
          {playlistContext.items.map((item) => {
            if (!item.courseSlug || !item.lessonLegacyId) return null;
            const href = itemHref(item, playlistSlug);
            const isActive =
              item.courseSlug === course.slug && item.lessonLegacyId === currentLesson.id;
            const key = lessonProgressKey(item.courseSlug, item.lessonLegacyId);
            const isDone =
              isItemPlayable(item.accessStatus) &&
              (playlistCompletedKeys.has(key) ||
                (item.courseSlug === course.slug && completed.has(item.lessonLegacyId)));
            return (
              <li key={item.id}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-foreground/[0.08] text-foreground"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  <LessonPreviewThumb
                    title={item.lessonTitle ?? item.courseTitle ?? "Video"}
                    isFree={item.accessStatus === "free"}
                    hasAccess={item.accessStatus === "owned"}
                    durationMinutes={item.durationMinutes ?? 0}
                    size="sm"
                    watchProgress={
                      item.lessonLegacyId && item.courseSlug
                        ? getLessonWatchRatio(
                            item.lessonLegacyId,
                            item.durationMinutes ?? 0
                          )
                        : undefined
                    }
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 line-clamp-2 leading-snug",
                      isActive && "font-medium text-foreground"
                    )}
                  >
                    {item.lessonTitle ?? item.courseTitle}
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald" aria-hidden />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    ) : null;

  const lessonList = (
    <div className="flex flex-col gap-4">
      {course.modules.map((module, moduleIndex) => (
        <div key={module.title}>
          <p className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
            {formatModuleTitle(module.title)}
          </p>
          <ul className="flex flex-col gap-0.5">
            {module.lessons.map((lesson, lessonIndex) => {
              const isActive = lesson.id === currentLesson.id;
              const isFree = isLessonFreePreview(lesson, moduleIndex, lessonIndex);
              const accessible = hasCourseAccess || isFree;
              const isDone = accessible && completed.has(lesson.id);
              return (
                <li key={lesson.id}>
                  <Link
                    href={`/belajar/${course.slug}/${lesson.id}`}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-foreground/[0.08] text-foreground"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <LessonPreviewThumb
                      title={lesson.title}
                      isFree={isFree}
                      hasAccess={hasCourseAccess}
                      durationMinutes={lesson.durationMinutes}
                      size="sm"
                      watchProgress={getLessonWatchRatio(lesson.id, lesson.durationMinutes)}
                    />
                    <span
                      className={cn(
                        "min-w-0 flex-1 line-clamp-2 leading-snug",
                        isActive && "font-medium text-foreground"
                      )}
                    >
                      {lesson.title}
                    </span>
                    {isDone ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );

  const sidebarPanel = (
    <>
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 rounded-lg border border-border/70 bg-muted/20 p-0.5">
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
            {playlistSlug ? "Playlist" : "Kurikulum"}
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
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={sidebarTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
        >
          {sidebarTab === "video" ? (
            <>
              <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span>
                  {completedLessonCount}/{courseLessonTotal} selesai
                </span>
                <span className="font-mono tabular-nums">{progressPercent}%</span>
              </div>
              <Progress
                value={progressPercent}
                aria-label={`${completedLessonCount} dari ${courseLessonTotal} pelajaran selesai`}
                className="h-1 [&_[data-slot=progress-indicator]]:bg-foreground"
              />
              <div
                className={cn(
                  "min-h-0 max-h-[min(28rem,55vh)] overflow-y-auto overscroll-contain",
                  "scroll-pb-4 pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))]",
                  "lg:max-h-none lg:flex-1 lg:scroll-pb-6 lg:pb-12"
                )}
              >
                {playlistLessonList ?? lessonList}
              </div>
            </>
          ) : (
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col overflow-hidden",
                mobileNotesStudio ? "max-lg:min-h-0 max-lg:flex-1" : "max-h-[min(28rem,55vh)] lg:max-h-none"
              )}
            >
              <LessonNotesPanel
                courseSlug={course.slug}
                courseTitle={course.title}
                lessonId={currentLesson.id}
                lessonTitle={currentLesson.title}
                variant="sidebar"
                mobileStudio={mobileNotesStudio}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );

  return (
    <div
      ref={layoutRef}
      className={cn(
        "grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_var(--sidebar-w)]",
        mobileNotesStudio &&
          "max-lg:flex max-lg:h-[var(--vv-height,100dvh)] max-lg:max-h-[var(--vv-height,100dvh)] max-lg:min-h-0 max-lg:flex-col max-lg:overflow-hidden max-lg:overscroll-none max-lg:transition-none"
      )}
      style={{ "--sidebar-w": `${sidebarWidth}px` } as CSSProperties}
    >
      <main
        className={cn(
          "flex min-w-0 flex-col border-border max-lg:pt-0 lg:border-r lg:p-5 lg:py-6",
          theaterMode && "lg:px-4 xl:px-6",
          mobileNotesStudio && "max-lg:shrink-0 max-lg:overflow-visible"
        )}
      >
        <div
          className={cn(
            "w-full transition-[max-width] duration-200 ease-out",
            theaterMode ? "mx-auto max-w-none" : "max-lg:mx-0 max-lg:max-w-none lg:mx-auto lg:max-w-3xl"
          )}
        >
          <MobileLessonMiniPlayerShell
            onCollapseProgress={setMobileCollapse}
            onRequestExit={navigateBackFromLesson}
            overlayChromeVisible={mobileVideoChromeVisible}
            suppressSlotTransition={mobileNotesStudio}
            playback={mobilePlayback}
            onTogglePlay={() => {
              playerRef.current?.togglePlay();
              window.setTimeout(() => {
                const state = playerRef.current?.getPlaybackState();
                if (state) setMobilePlayback(state);
              }, 0);
            }}
          >
            <div className="relative size-full overflow-hidden bg-black max-lg:rounded-none max-lg:border-0 lg:rounded-lg lg:border lg:border-border/80 lg:shadow-sm">
            <button
              type="button"
              onClick={() => setTheaterMode((v) => !v)}
              className="absolute right-2 top-2 z-20 hidden size-8 items-center justify-center rounded-md bg-black/55 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/75 lg:inline-flex"
              title={theaterMode ? "Ukuran standar" : "Perbesar video"}
              aria-label={theaterMode ? "Kembalikan ukuran video standar" : "Perbesar area video"}
              aria-pressed={theaterMode}
            >
              {theaterMode ? (
                <Minimize2 className="size-4" aria-hidden />
              ) : (
                <Maximize2 className="size-4" aria-hidden />
              )}
            </button>
            <ProtectedVideoPlayer
              ref={playerRef}
              courseId={course.slug}
              lessonId={currentLesson.id}
              lessonTitle={currentLesson.title}
              durationMinutes={currentLesson.durationMinutes}
              isPreview={isPreview}
              hasAccess={hasCourseAccess}
              userId={session?.userId}
              userEmail={session?.email}
              previewLessonHref={firstPreviewLessonHref}
              lockedReturnPath={pathname || `/belajar/${course.slug}/${currentLesson.id}`}
              seekRequestSeconds={seekRequestSeconds}
              onTimeUpdate={handleVideoTimeUpdate}
              onProtectionViolation={handleProtectionViolation}
              hideControlBar={mobileCollapse > 0.22}
              onMobileChromeVisibleChange={setMobileVideoChromeVisible}
              onWatchCompletionEligible={handleWatchCompletionEligible}
              className="max-lg:h-full max-lg:min-h-0 max-lg:rounded-none max-lg:border-0 max-lg:[&_.video-player-shell]:h-full max-lg:[&_.video-player-shell]:aspect-auto"
            />
            </div>
          </MobileLessonMiniPlayerShell>

          <div
            className={cn(
              "max-lg:grid max-lg:transition-[grid-template-rows] max-lg:duration-500 max-lg:ease-[cubic-bezier(0.22,1,0.36,1)] lg:contents",
              mobileNotesStudio ? "max-lg:grid-rows-[0fr]" : "max-lg:grid-rows-[1fr]"
            )}
          >
            <div
              className={cn(
                "max-lg:min-h-0 max-lg:overflow-hidden max-lg:transition-[opacity,transform] max-lg:duration-500 max-lg:ease-[cubic-bezier(0.22,1,0.36,1)] lg:contents",
                mobileNotesStudio
                  ? "max-lg:pointer-events-none max-lg:opacity-0 max-lg:-translate-y-1"
                  : "max-lg:opacity-100 max-lg:translate-y-0"
              )}
              style={
                mobileNotesStudio
                  ? undefined
                  : ({
                      opacity:
                        mobileCollapse >= 0.96
                          ? 1
                          : mobileCollapse > 0
                            ? 1 - mobileCollapse * 0.45
                            : 1,
                    } as CSSProperties)
              }
            >
          <header
            className={cn(
              "mt-3 border-b border-border/60 px-4 pb-4 max-lg:pt-1 lg:mt-4 lg:px-0",
              theaterMode && "mx-auto w-full max-w-3xl"
            )}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 space-y-1.5">
                <h1 className="font-heading text-base font-medium leading-snug sm:text-lg">
                  {currentLesson.title}
                </h1>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {mentor ? (
                    <Link
                      href={`/instruktur/${mentor.slug}`}
                      className="text-foreground/85 hover:underline"
                    >
                      {mentor.name}
                    </Link>
                  ) : null}
                  <span className="hidden lg:inline">
                    {mentor ? <span aria-hidden> · </span> : null}
                    {currentLesson.durationMinutes} menit
                  </span>
                </p>
                {lessonDescription ? (
                  <p className="section-copy pt-1 text-sm leading-relaxed text-muted-foreground max-lg:block lg:mt-2 lg:max-w-2xl">
                    {lessonDescription}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center">
                <LessonQuickActions
                  onShare={() => void handleShareLesson()}
                  shareFeedback={shareFeedback}
                  guidebookHref={guidebookHref}
                  guidebookExternal={guidebookExternal}
                />
                <BookmarkToggleButton
                  bookmarkRef={{
                    type: "lesson",
                    courseSlug: course.slug,
                    lessonId: currentLesson.id,
                  }}
                  className="size-9 shrink-0 opacity-100"
                />
              </div>
            </div>
          </header>

          <div
            className={cn(
              "mt-3 flex flex-col gap-2 px-4 max-lg:items-end sm:flex-row sm:flex-wrap sm:items-center lg:mt-4 lg:gap-3 lg:px-0",
              theaterMode && "mx-auto w-full max-w-3xl"
            )}
          >
            {canTrackProgress ? (
              <>
                {isCurrentDone && continueHref ? (
                  <Button
                    size="sm"
                    className="btn-primary w-full sm:w-auto max-lg:h-9 max-lg:w-9 max-lg:min-w-9 max-lg:border-transparent max-lg:bg-transparent max-lg:p-0 max-lg:text-muted-foreground/40 max-lg:shadow-none hover:max-lg:text-muted-foreground/70"
                    disabled={!progressReady}
                    aria-label="Pelajaran berikutnya"
                    onClick={() => void handleContinue()}
                  >
                    <span className="hidden lg:inline">Pelajaran berikutnya</span>
                    <ArrowRight className="size-4 lg:ml-1" />
                  </Button>
                ) : null}
              </>
            ) : (
              <Button
                size="sm"
                className="w-full sm:w-auto"
                disabled={!progressReady}
                render={<Link href={`/kelas/${course.slug}`} />}
              >
                Dapatkan akses kelas
              </Button>
            )}
          </div>

          {hasMaterials ? (
            <ul
              className={cn(
                "mt-4 space-y-1 border-t border-border/60 px-4 pt-4 lg:px-0",
                theaterMode && "mx-auto w-full max-w-3xl"
              )}
            >
              {lessonMaterials.map((material) => (
                <li key={material.id}>
                  <a
                    href={material.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Download className="size-3.5 shrink-0" />
                    {material.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
            </div>
          </div>
        </div>
      </main>

      <aside
        className={cn(
          "relative flex min-w-0 flex-col border-t border-border p-4 sm:p-5 lg:sticky lg:top-12 lg:max-h-[calc(100dvh-3rem)] lg:min-h-0 lg:overflow-hidden lg:border-t-0 lg:border-l lg:py-6",
          sidebarTab === "catatan" && "lg:bg-muted/10",
          "max-lg:transition-[opacity,transform] max-lg:duration-500 max-lg:ease-[cubic-bezier(0.22,1,0.36,1)] lg:opacity-100",
          mobileNotesStudio
            ? "max-lg:min-h-0 max-lg:flex-1 max-lg:translate-y-0 max-lg:overflow-hidden max-lg:border-t-0 max-lg:bg-background max-lg:px-3 max-lg:pb-0 max-lg:pt-2 max-lg:opacity-100 max-lg:transition-none"
            : "max-lg:translate-y-0"
        )}
        style={
          mobileNotesStudio
            ? undefined
            : ({
                opacity:
                  mobileCollapse >= 0.96
                    ? 1
                    : mobileCollapse > 0
                      ? 1 - mobileCollapse * 0.45
                      : undefined,
              } as CSSProperties)
        }
      >
        <LearningSidebarResizeHandle
          containerRef={layoutRef}
          widthRef={sidebarWidthRef}
          onWidthChange={applyWidth}
          onWidthCommit={persist}
        />
        {sidebarTab === "catatan" ? (
          <p className="mb-1 hidden text-[10px] text-muted-foreground lg:block">
            Tarik tepi kiri panel untuk melebarkan catatan.
          </p>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">{sidebarPanel}</div>
      </aside>
    </div>
  );
}

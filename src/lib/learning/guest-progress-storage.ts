/** Guest lesson progress in localStorage (HOLD-05 B: 30-day TTL). */

import {
  loadGlobalGuestCompletedKeys,
  mergeCourseGuestProgress,
  rememberGlobalGuestCompletion,
} from "@/lib/learning/global-guest-progress";

const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export { loadGlobalGuestCompletedKeys, mergeCourseGuestProgress, rememberGlobalGuestCompletion };

interface GuestProgressPayload {
  savedAt: number;
  completedLessonIds: string[];
  verifiedSecondsByLesson?: Record<string, number>;
}

function storageKey(courseSlug: string): string {
  return `bursa:guest-progress:${courseSlug}`;
}

export function loadGuestProgress(courseSlug: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(storageKey(courseSlug));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as GuestProgressPayload;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > TTL_MS) {
      localStorage.removeItem(storageKey(courseSlug));
      return new Set();
    }
    return new Set(parsed.completedLessonIds ?? []);
  } catch {
    return new Set();
  }
}

function readPayload(courseSlug: string): GuestProgressPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(courseSlug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestProgressPayload;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > TTL_MS) {
      localStorage.removeItem(storageKey(courseSlug));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function loadGuestVerifiedSeconds(courseSlug: string): Record<string, number> {
  return readPayload(courseSlug)?.verifiedSecondsByLesson ?? {};
}

export function saveGuestVerifiedSeconds(
  courseSlug: string,
  lessonId: string,
  verifiedSeconds: number,
  completedLessonIds: Iterable<string>
): void {
  if (typeof window === "undefined") return;
  try {
    const existing = readPayload(courseSlug);
    const verifiedSecondsByLesson = {
      ...(existing?.verifiedSecondsByLesson ?? {}),
      [lessonId]: verifiedSeconds,
    };
    const ids = [...completedLessonIds];
    const payload: GuestProgressPayload = {
      savedAt: Date.now(),
      completedLessonIds: ids,
      verifiedSecondsByLesson,
    };
    localStorage.setItem(storageKey(courseSlug), JSON.stringify(payload));
    for (const id of ids) {
      rememberGlobalGuestCompletion(courseSlug, id);
    }
  } catch {
    // ignore
  }
}

export function saveGuestProgress(courseSlug: string, completedLessonIds: Iterable<string>): void {
  if (typeof window === "undefined") return;
  try {
    const existing = readPayload(courseSlug);
    const ids = [...completedLessonIds];
    const payload: GuestProgressPayload = {
      savedAt: Date.now(),
      completedLessonIds: ids,
      verifiedSecondsByLesson: existing?.verifiedSecondsByLesson,
    };
    localStorage.setItem(storageKey(courseSlug), JSON.stringify(payload));
    for (const lessonId of ids) {
      rememberGlobalGuestCompletion(courseSlug, lessonId);
    }
  } catch {
    // Quota or private mode: ignore
  }
}

export const GUEST_PROGRESS_TTL_DAYS = 30;

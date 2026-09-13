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

export function saveGuestProgress(courseSlug: string, completedLessonIds: Iterable<string>): void {
  if (typeof window === "undefined") return;
  try {
    const ids = [...completedLessonIds];
    const payload: GuestProgressPayload = {
      savedAt: Date.now(),
      completedLessonIds: ids,
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

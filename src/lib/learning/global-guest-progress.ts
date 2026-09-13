import { lessonProgressKey } from "@/lib/learning/lesson-progress-key";

const GLOBAL_KEY = "bursa:guest-progress:global";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface GlobalGuestProgressPayload {
  savedAt: number;
  completedKeys: string[];
}

function readPayload(): GlobalGuestProgressPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GLOBAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GlobalGuestProgressPayload;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > TTL_MS) {
      localStorage.removeItem(GLOBAL_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function loadGlobalGuestCompletedKeys(): Set<string> {
  const payload = readPayload();
  return new Set(payload?.completedKeys ?? []);
}

export function rememberGlobalGuestCompletion(courseSlug: string, lessonLegacyId: string): void {
  if (typeof window === "undefined") return;
  const key = lessonProgressKey(courseSlug, lessonLegacyId);
  const keys = loadGlobalGuestCompletedKeys();
  keys.add(key);
  try {
    const payload: GlobalGuestProgressPayload = {
      savedAt: Date.now(),
      completedKeys: [...keys],
    };
    localStorage.setItem(GLOBAL_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota
  }
}

export function mergeCourseGuestProgress(
  courseSlug: string,
  courseLessonIds: Iterable<string>,
  courseLocal: Set<string>
): Set<string> {
  const global = loadGlobalGuestCompletedKeys();
  const merged = new Set(courseLocal);
  for (const lessonId of courseLessonIds) {
    if (global.has(lessonProgressKey(courseSlug, lessonId))) {
      merged.add(lessonId);
    }
  }
  for (const key of global) {
    const parsed = key.split("/");
    if (parsed.length !== 2) continue;
    const [slug, lessonId] = parsed;
    if (slug === courseSlug) merged.add(lessonId);
  }
  return merged;
}

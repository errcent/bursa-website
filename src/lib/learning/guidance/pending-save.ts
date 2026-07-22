import type { LearningGuidanceAnswers, LearningGuidanceResult } from "@/lib/learning/guidance/types";

const STORAGE_KEY = "bursa-guidance-pending";

type PendingGuidance = {
  answers: LearningGuidanceAnswers;
  result: LearningGuidanceResult;
  savedAt: number;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function savePendingGuidance(
  answers: LearningGuidanceAnswers,
  result: LearningGuidanceResult
): void {
  if (!isBrowser()) return;
  try {
    const payload: PendingGuidance = {
      answers,
      result,
      savedAt: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // quota / private mode — non-blocking
  }
}

export function readPendingGuidance(): PendingGuidance | null {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingGuidance;
    if (!parsed?.answers || !parsed?.result) return null;
    // Expire after 24h
    if (Date.now() - (parsed.savedAt ?? 0) > 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingGuidance(): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

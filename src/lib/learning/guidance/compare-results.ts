import { guidancePickKey } from "@/lib/learning/guidance/pick-presenters";
import type { LearningGuidanceResult } from "@/lib/learning/guidance/types";

function recommendationKey(result: LearningGuidanceResult): string {
  const primary = (result.primary ?? []).map(guidancePickKey).join("\0");
  const supporting = (result.supporting ?? []).map(guidancePickKey).join("\0");
  return `${primary}::${supporting}`;
}

/** True when recommended courses and playlists are identical (order-sensitive). */
export function areGuidanceResultsEquivalent(
  a: LearningGuidanceResult,
  b: LearningGuidanceResult
): boolean {
  return recommendationKey(a) === recommendationKey(b);
}

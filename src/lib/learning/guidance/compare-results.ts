import type { LearningGuidanceResult } from "@/lib/learning/guidance/types";

function recommendationKey(result: LearningGuidanceResult): string {
  const courseSlugs = result.courses.map(({ course }) => course.slug).join("\0");
  const playlistSlugs = (result.playlists ?? [])
    .map(({ playlist }) => playlist.slug)
    .join("\0");
  return `${courseSlugs}::${playlistSlugs}`;
}

/** True when recommended courses and playlists are identical (order-sensitive). */
export function areGuidanceResultsEquivalent(
  a: LearningGuidanceResult,
  b: LearningGuidanceResult
): boolean {
  return recommendationKey(a) === recommendationKey(b);
}

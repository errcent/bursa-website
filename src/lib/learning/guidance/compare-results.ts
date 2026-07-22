import type { LearningGuidanceResult } from "@/lib/learning/guidance/types";

function recommendationKey(result: LearningGuidanceResult): string {
  const courseSlugs = result.courses.map(({ course }) => course.slug).join("\0");
  const mentorSlugs = result.mentors.map(({ mentor }) => mentor.slug).join("\0");
  return `${courseSlugs}::${mentorSlugs}`;
}

/** True when recommended courses and mentors are identical (order-sensitive). */
export function areGuidanceResultsEquivalent(
  a: LearningGuidanceResult,
  b: LearningGuidanceResult
): boolean {
  return recommendationKey(a) === recommendationKey(b);
}

import type { CourseCardEnrollment } from "@/components/course-card";
import type { LearningCourseProgress } from "@/hooks/use-my-learning";

export function courseEnrollmentFromLearning(
  learning: LearningCourseProgress | undefined
): CourseCardEnrollment | null {
  if (!learning) return null;
  return {
    progressPercent: learning.progressPercent,
    completedLessons: learning.completedLessons,
    totalLessons: learning.totalLessons,
    lastLessonId: learning.lastLessonId,
  };
}

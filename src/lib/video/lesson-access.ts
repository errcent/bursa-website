import type { Course, Lesson, Module } from "@/lib/types";

export interface LessonModuleContext {
  module: Module;
  moduleIndex: number;
  lessonIndex: number;
  lesson: Lesson;
}

export function findLessonInCourse(
  course: Course,
  lessonId: string
): LessonModuleContext | null {
  for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex++) {
    const module = course.modules[moduleIndex];
    const lessonIndex = module.lessons.findIndex((lesson) => lesson.id === lessonId);
    if (lessonIndex >= 0) {
      return { module, moduleIndex, lessonIndex, lesson: module.lessons[lessonIndex] };
    }
  }
  return null;
}

/** Only the first lesson of the first module is automatically free. */
export function isFreeModuleLesson(moduleIndex: number, lessonIndex: number): boolean {
  return moduleIndex === 0 && lessonIndex === 0;
}

/** Free via explicit preview flag or the automatic first-module rule. */
export function isLessonFreePreview(
  lesson: Pick<Lesson, "preview">,
  moduleIndex: number,
  lessonIndex: number
): boolean {
  return lesson.preview === true || isFreeModuleLesson(moduleIndex, lessonIndex);
}

/**
 * Thumbnail blur/lock for guests. Subscribers (enrolled) see clear previews
 * for every lesson; guests only see free-preview lessons clear.
 */
export function isLessonPreviewLocked(
  lesson: Pick<Lesson, "preview">,
  moduleIndex: number,
  lessonIndex: number,
  hasCourseAccess: boolean
): boolean {
  if (hasCourseAccess) return false;
  return !isLessonFreePreview(lesson, moduleIndex, lessonIndex);
}

export function getNextLesson(course: Course, currentLessonId: string): Lesson | null {
  const allLessons = course.modules.flatMap((module) => module.lessons);
  const currentIndex = allLessons.findIndex((lesson) => lesson.id === currentLessonId);
  if (currentIndex < 0 || currentIndex >= allLessons.length - 1) return null;
  return allLessons[currentIndex + 1];
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { LearningWorkspace } from "@/components/learning-workspace";
import { courses, getCourseBySlug } from "@/lib/mock-data";

export function generateStaticParams() {
  return courses.flatMap((course) =>
    course.modules
      .flatMap((m) => m.lessons)
      .map((lesson) => ({ courseId: course.slug, lessonId: lesson.id }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;
  const course = getCourseBySlug(courseId);
  if (!course) return {};
  return { title: `Belajar · ${course.title}` };
}

export default async function LearningPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const course = getCourseBySlug(courseId);
  if (!course) notFound();

  const lessonExists = course.modules.some((m) => m.lessons.some((l) => l.id === lessonId));
  if (!lessonExists) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center border-b border-border px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold">
          Bursa
        </Link>
      </header>
      <LearningWorkspace course={course} currentLessonId={lessonId} />
    </div>
  );
}

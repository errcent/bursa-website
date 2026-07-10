import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";

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
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 sm:px-6">
        <Link
          href={`/kelas/${course.slug}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Kembali</span>
        </Link>
        <Link href="/" className="truncate text-lg font-semibold">
          Bursa
        </Link>
        <span className="ml-auto max-w-[45%] truncate text-xs text-muted-foreground sm:max-w-none">
          {course.title}
        </span>
      </header>
      <LearningWorkspace course={course} currentLessonId={lessonId} />
    </div>
  );
}

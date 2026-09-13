import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";

import { LearningWorkspace } from "@/components/learning-workspace";
import { getCatalogCourseSlugs, getCourseBySlug, getMentorBySlug } from "@/lib/catalog/server";

export async function generateStaticParams() {
  const slugs = await getCatalogCourseSlugs();
  const params: { courseId: string; lessonId: string }[] = [];

  for (const slug of slugs) {
    const course = await getCourseBySlug(slug);
    if (!course) continue;
    for (const lesson of course.modules.flatMap((module) => module.lessons)) {
      params.push({ courseId: slug, lessonId: lesson.id });
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;
  const course = await getCourseBySlug(courseId);
  if (!course) return {};
  return { title: `Belajar · ${course.title}` };
}

export default async function LearningPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const course = await getCourseBySlug(courseId);
  if (!course) notFound();

  const mentor = await getMentorBySlug(course.mentorSlug);
  if (!mentor) notFound();

  const lessonExists = course.modules.some((m) => m.lessons.some((l) => l.id === lessonId));
  if (!lessonExists) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-background max-lg:h-dvh max-lg:min-h-0 max-lg:overflow-hidden">
      <header className="hidden h-12 shrink-0 items-center gap-2 border-b border-border px-4 sm:px-5 lg:flex">
        <Link
          href={`/kelas/${course.slug}`}
          className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Kembali ke kelas"
        >
          <ChevronLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">Kelas</span>
        </Link>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground/90">
          {course.title}
        </span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col max-lg:overflow-hidden">
        <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Memuat…</p>}>
          <LearningWorkspace course={course} currentLessonId={lessonId} mentor={mentor} />
        </Suspense>
      </div>
    </div>
  );
}

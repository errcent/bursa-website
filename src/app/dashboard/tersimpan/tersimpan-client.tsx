"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";

import { AuthGuard } from "@/components/auth-guard";
import { CourseCard } from "@/components/course-card";
import { MentorCard } from "@/components/mentor-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useCatalogIndex } from "@/hooks/use-catalog-index";
import type { BookmarkEntry } from "@/lib/bookmarks/types";

function SavedSection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Boolean(children);
  return (
    <section className="border-b border-border/60 py-8 first:pt-0 last:border-b-0">
      <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-4">
        {hasChildren ? children : <p className="text-sm text-muted-foreground">{empty}</p>}
      </div>
    </section>
  );
}

function SavedContent() {
  const { entries, loading } = useBookmarks();
  const { index } = useCatalogIndex();
  const courses = index?.courses ?? [];
  const mentors = index?.mentors ?? [];

  const courseEntries = entries.filter((e) => e.type === "course");
  const lessonEntries = entries.filter((e) => e.type === "lesson");
  const playlistEntries = entries.filter((e) => e.type === "playlist");
  const mentorEntries = entries.filter((e) => e.type === "mentor");

  const courseBySlug = new Map(courses.map((c) => [c.slug, c]));
  const mentorBySlug = new Map(mentors.map((m) => [m.slug, m]));

  if (loading) {
    return <p className="text-sm text-muted-foreground">Memuat simpanan…</p>;
  }

  if (!entries.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
        <Bookmark className="mx-auto mb-3 size-10 text-muted-foreground" />
        <p className="text-muted-foreground">Belum ada kelas, video, playlist, atau mentor tersimpan.</p>
        <Link
          href="/katalog"
          className="mt-4 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
        >
          Jelajahi katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <SavedSection title="Kelas tersimpan" empty="Belum ada kelas tersimpan.">
        {courseEntries.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courseEntries.map((entry: BookmarkEntry) => {
              if (entry.type !== "course") return null;
              const course = courseBySlug.get(entry.slug);
              if (!course) return null;
              const mentor = mentors.find((m) => m.slug === course.mentorSlug);
              return (
                <CourseCard key={entry.slug} course={course} mentor={mentor} />
              );
            })}
          </div>
        )}
      </SavedSection>

      <SavedSection title="Video tersimpan" empty="Belum ada video tersimpan.">
        {lessonEntries.length > 0 && (
          <ul className="space-y-2">
            {lessonEntries.map((entry) => {
              if (entry.type !== "lesson") return null;
              const course = courseBySlug.get(entry.courseSlug);
              const lesson = course?.modules
                ?.flatMap((m) => m.lessons)
                .find((l) => l.id === entry.lessonId);
              if (!course || !lesson) return null;
              return (
                <li key={`${entry.courseSlug}:${entry.lessonId}`}>
                  <Link
                    href={`/belajar/${course.slug}/${lesson.id}`}
                    className="block rounded-lg border border-border/50 px-4 py-3 hover:bg-muted/40"
                  >
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-sm text-muted-foreground">{course.title}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </SavedSection>

      <SavedSection title="Playlist tersimpan" empty="Belum ada playlist tersimpan.">
        {playlistEntries.length > 0 && (
          <ul className="space-y-2">
            {playlistEntries.map((entry) => {
              if (entry.type !== "playlist") return null;
              return (
                <li key={entry.slug}>
                  <Link
                    href={`/playlist/${entry.slug}`}
                    className="block rounded-lg border border-border/50 px-4 py-3 hover:bg-muted/40"
                  >
                    <p className="font-medium">{entry.slug}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </SavedSection>

      <SavedSection title="Mentor tersimpan" empty="Belum ada mentor tersimpan.">
        {mentorEntries.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mentorEntries.map((entry) => {
              if (entry.type !== "mentor") return null;
              const mentor = mentorBySlug.get(entry.slug);
              if (!mentor) return null;
              return <MentorCard key={entry.slug} mentor={mentor} />;
            })}
          </div>
        )}
      </SavedSection>
    </div>
  );
}

export default function TersimpanClient() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <SiteNavbar />
        <main className="flex-1">
          <div className="hero-cinematic page-header-strip border-b border-border/40">
            <div className="container-page py-12 sm:py-14">
              <p className="eyebrow mb-3">Dashboard</p>
              <h1 className="page-hero-title text-gradient">Tersimpan</h1>
              <p className="section-copy mt-4 max-w-lg text-pretty">
                Kelas, video, playlist, dan mentor yang kamu simpan — tersinkron saat masuk.
              </p>
            </div>
          </div>
          <div className="container-page section-tight pb-16 pt-8">
            <SavedContent />
          </div>
        </main>
        <SiteFooter />
      </div>
    </AuthGuard>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, BookOpen, Flame, PlayCircle } from "lucide-react";
import { motion } from "motion/react";

import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/components/auth-provider";
import { DashboardWatchlist } from "@/components/dashboard-watchlist";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { InstrumentBadge } from "@/components/instrument-badge";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { courses, formatRupiah } from "@/lib/mock-data";
import type { Instrument } from "@/lib/types";

type LearningCourse = {
  slug: string;
  title: string;
  instrument: Instrument;
  mentorSlug: string;
  mentorName: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  lastLessonId: string;
};

type LearningSummary = {
  enrolledCount: number;
  completedCourses: number;
  totalHoursLearned: number;
};

type LearningPayload = {
  courses: LearningCourse[];
  summary: LearningSummary;
};

const EMPTY_SUMMARY: LearningSummary = {
  enrolledCount: 0,
  completedCourses: 0,
  totalHoursLearned: 0,
};

function DashboardBody() {
  const { session } = useAuth();
  const [learning, setLearning] = useState<LearningPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.userId && !session?.email) {
      setLearning({ courses: [], summary: EMPTY_SUMMARY });
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams({
      ...(session.userId ? { userId: session.userId } : {}),
      ...(session.email ? { email: session.email } : {}),
    });

    void fetch(`/api/me/learning?${params}`, {
      cache: "no-store",
      headers: session.email ? { "x-user-email": session.email } : {},
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        return (await res.json()) as LearningPayload;
      })
      .then((data) => {
        if (!cancelled) {
          setLearning({
            courses: data.courses ?? [],
            summary: data.summary ?? EMPTY_SUMMARY,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLearning({ courses: [], summary: EMPTY_SUMMARY });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.userId, session?.email]);

  const inProgress = learning?.courses ?? [];
  const summary = learning?.summary ?? EMPTY_SUMMARY;
  const hasProgress = inProgress.length > 0;

  return (
    <>
      <SiteNavbar />
      <main className="flex-1 overflow-x-clip">
        <div className="hero-cinematic page-header-strip">
          <div className="container-page py-10 sm:py-12">
            <Reveal>
              <p className="eyebrow mb-2">Dashboard</p>
              <p className="text-sm text-muted-foreground">Selamat datang kembali,</p>
              <h1 className="page-hero-title text-gradient mt-1">{session?.name ?? "Pelajar"}</h1>
              <Link href="/pengaturan#profil" className="link-muted mt-3 inline-flex text-sm">
                Edit profil
              </Link>
            </Reveal>
          </div>
        </div>

        <div className="container-page section-spacious">
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="flex min-w-0 flex-col gap-10">
              <section>
                <Reveal className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="section-title flex min-w-0 items-center gap-2">
                    <Flame className="size-4 text-accent" />
                    Lanjutkan Belajar
                  </h2>
                  <Link href="/katalog" className="link-accent shrink-0 text-sm">
                    Cari kelas baru
                  </Link>
                </Reveal>

                {loading ? (
                  <div className="surface-card p-8 text-center text-sm text-muted-foreground">
                    Memuat progress…
                  </div>
                ) : !hasProgress ? (
                  <div className="surface-card flex flex-col items-center gap-4 p-8 text-center">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-soft via-surface-2 to-background">
                      <BookOpen className="size-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-heading text-sm font-medium">Belum ada progress</p>
                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        Kamu belum mengikuti kelas. Mulai belajar dari katalog untuk melihat
                        progress di sini.
                      </p>
                    </div>
                    <Button render={<Link href="/katalog" />} className="btn-primary">
                      Mulai Belajar
                    </Button>
                  </div>
                ) : (
                  <Stagger className="flex flex-col gap-4">
                    {inProgress.map((course) => (
                      <StaggerItem key={course.slug}>
                        <motion.div whileHover={{ y: -4 }}>
                          <Link
                            href={`/belajar/${course.slug}/${course.lastLessonId}`}
                            className="surface-card-hover flex min-w-0 flex-col gap-3 p-5 sm:flex-row sm:items-center"
                          >
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-soft via-surface-2 to-background">
                              <PlayCircle className="size-6 text-accent" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <InstrumentBadge instrument={course.instrument} />
                              </div>
                              <p className="line-clamp-2 font-heading text-sm font-medium">{course.title}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                oleh {course.mentorName}
                              </p>
                              <div className="mt-2 flex w-full min-w-0 items-center gap-3">
                                <Progress
                                  value={course.progressPercent}
                                  className="min-w-0 w-full max-w-40 [&_[data-slot=progress-indicator]]:bg-accent"
                                />
                                <span className="shrink-0 text-xs text-muted-foreground">
                                  {course.progressPercent}%
                                </span>
                              </div>
                            </div>
                            <span className="btn-primary inline-flex h-8 shrink-0 items-center justify-center rounded-lg px-3 text-xs font-medium">
                              {course.progressPercent === 0 ? "Mulai" : "Lanjutkan"}
                            </span>
                          </Link>
                        </motion.div>
                      </StaggerItem>
                    ))}
                  </Stagger>
                )}
              </section>

              <section>
                <Reveal>
                  <h2 className="section-title mb-4 flex items-center gap-2">
                    <Award className="size-4 text-accent" />
                    Sertifikat Saya
                  </h2>
                </Reveal>
                <div className="surface-card flex flex-col items-center gap-3 p-8 text-center">
                  <Award className="size-5 text-muted-foreground" />
                  <div>
                    <p className="font-heading text-sm font-medium">Belum ada sertifikat</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Selesaikan kelas untuk mendapatkan sertifikat.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <Reveal>
                  <h2 className="section-title mb-4">Rekomendasi Lanjutan</h2>
                </Reveal>
                <Stagger className="flex gap-3 overflow-x-auto pb-2 sm:gap-4">
                  {courses.slice(0, 3).map((course) => (
                    <StaggerItem key={course.slug} className="w-56 shrink-0 sm:w-64">
                      <Link
                        href={`/kelas/${course.slug}`}
                        className="surface-card-hover flex h-full flex-col gap-2 p-4"
                      >
                        <InstrumentBadge instrument={course.instrument} className="w-fit" />
                        <p className="line-clamp-2 font-heading text-sm font-medium">
                          {course.title}
                        </p>
                        <p className="font-mono text-xs font-medium tabular-nums">
                          {formatRupiah(course.price)}
                        </p>
                      </Link>
                    </StaggerItem>
                  ))}
                </Stagger>
              </section>
            </div>

            <aside className="flex min-w-0 flex-col gap-4">
              <Reveal>
                <DashboardWatchlist />
              </Reveal>

              <Reveal delay={0.1}>
                <div className="surface-card p-5">
                  <h3 className="mb-3 font-heading text-sm font-medium">Ringkasan Belajar</h3>
                  <dl className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between border-b border-border/60 pb-2">
                      <dt className="text-muted-foreground">Kelas diikuti</dt>
                      <dd className="font-medium">{loading ? "—" : summary.enrolledCount}</dd>
                    </div>
                    <div className="flex justify-between border-b border-border/60 pb-2">
                      <dt className="text-muted-foreground">Kelas selesai</dt>
                      <dd className="font-medium">
                        {loading ? "—" : summary.completedCourses}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Total jam belajar</dt>
                      <dd className="font-medium">
                        {loading ? "—" : `${summary.totalHoursLearned} jam`}
                      </dd>
                    </div>
                  </dl>
                </div>
              </Reveal>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export function DashboardShell() {
  return (
    <AuthGuard>
      <DashboardBody />
    </AuthGuard>
  );
}

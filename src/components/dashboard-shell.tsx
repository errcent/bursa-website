"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Award, BookOpen, Flame } from "lucide-react";
import { motion } from "motion/react";

import { CourseThumbnail } from "@/components/course-thumbnail";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/components/auth-provider";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { InstrumentBadge } from "@/components/instrument-badge";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCatalogIndex } from "@/hooks/use-catalog-index";
import { useMyLearning } from "@/hooks/use-my-learning";
import { subscribeLearningChange } from "@/lib/learning/events";
import { formatRupiah } from "@/lib/mock-data";
import type { Course, Instrument } from "@/lib/types";

type LearningCourse = {
  slug: string;
  title: string;
  thumbnailUrl?: string | null;
  instrument: Instrument;
  mentorSlug: string;
  mentorName: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  lastLessonId: string;
};

type LearningPayload = {
  courses: LearningCourse[];
};

function DashboardBody() {
  const { session } = useAuth();
  const { bySlug: enrollmentBySlug } = useMyLearning();
  const { index: catalogIndex, loading: catalogLoading } = useCatalogIndex();
  const [learning, setLearning] = useState<LearningPayload | null>(null);
  const [guidanceCourses, setGuidanceCourses] = useState<Course[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    return subscribeLearningChange(() => setRefreshKey((key) => key + 1));
  }, []);

  useEffect(() => {
    if (!session?.userId && !session?.email) {
      setLearning({ courses: [] });
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
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLearning({ courses: [] });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey, session?.userId, session?.email]);

  useEffect(() => {
    if (!session?.userId && !session?.email) {
      setGuidanceCourses(null);
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({
      ...(session.userId ? { userId: session.userId } : {}),
      ...(session.email ? { email: session.email } : {}),
    });

    void fetch(`/api/me/learning-guidance?${params}`, {
      cache: "no-store",
      headers: session.email ? { "x-user-email": session.email } : {},
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as {
          result?: { courses?: Array<{ course: Course }> } | null;
        };
      })
      .then((data) => {
        if (cancelled) return;
        const courses =
          data?.result?.courses?.map((entry) => entry.course).filter(Boolean) ?? [];
        setGuidanceCourses(courses.length > 0 ? courses : null);
      })
      .catch(() => {
        if (!cancelled) setGuidanceCourses(null);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.userId, session?.email]);

  const enrolledSlugs = useMemo(
    () => new Set(enrollmentBySlug.keys()),
    [enrollmentBySlug]
  );

  const recommendations = useMemo(() => {
    const fromGuidance = guidanceCourses?.filter((course) => !enrolledSlugs.has(course.slug));
    if (fromGuidance && fromGuidance.length > 0) {
      return fromGuidance.slice(0, 3);
    }

    const courses = catalogIndex?.courses ?? [];
    return [...courses]
      .filter((course) => !enrolledSlugs.has(course.slug))
      .sort((a, b) => b.studentsCount - a.studentsCount)
      .slice(0, 3);
  }, [guidanceCourses, catalogIndex, enrolledSlugs]);

  const inProgress = learning?.courses ?? [];
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
              <Link href="/profil" className="link-muted mt-3 inline-flex text-sm">
                Edit profil
              </Link>
            </Reveal>
          </div>
        </div>

        <div className="container-page section-spacious">
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
                        Belum tahu mulai dari mana? Ikuti panduan belajar untuk rekomendasi kelas
                        dan mentor yang sesuai profilmu.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button render={<Link href="/panduan-belajar" />} className="btn-primary">
                        Temukan Jalur Belajar
                      </Button>
                      <Button render={<Link href="/katalog" />} variant="outline">
                        Jelajahi Katalog
                      </Button>
                    </div>
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
                            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                              <CourseThumbnail
                                course={{ slug: course.slug, thumbnailUrl: course.thumbnailUrl ?? undefined }}
                                fillSlot
                                objectFit="contain"
                                className="size-full"
                                alt={course.title}
                                progressPercent={course.progressPercent}
                              />
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
                {catalogLoading && recommendations.length === 0 ? (
                  <div className="surface-card p-8 text-center text-sm text-muted-foreground">
                    Memuat rekomendasi…
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="surface-card p-8 text-center text-sm text-muted-foreground">
                    Belum ada rekomendasi — jelajahi{" "}
                    <Link href="/katalog" className="link-accent">
                      katalog
                    </Link>{" "}
                    atau ikuti{" "}
                    <Link href="/panduan-belajar" className="link-accent">
                      panduan belajar
                    </Link>
                    .
                  </div>
                ) : (
                <Stagger className="flex gap-3 overflow-x-auto pb-2 sm:gap-4">
                  {recommendations.map((course) => {
                    const enrolled = enrollmentBySlug.get(course.slug);
                    return (
                    <StaggerItem key={course.slug} className="w-56 shrink-0 sm:w-64">
                      <Link
                        href={
                          enrolled?.lastLessonId
                            ? `/belajar/${course.slug}/${enrolled.lastLessonId}`
                            : `/kelas/${course.slug}`
                        }
                        className="surface-card-hover flex h-full flex-col overflow-hidden rounded-xl"
                      >
                        <div className="relative aspect-[16/10] w-full overflow-hidden">
                          <CourseThumbnail
                            course={course}
                            fillSlot
                            className="absolute inset-0"
                            alt={course.title}
                            progressPercent={
                              enrolled ? enrolled.progressPercent : undefined
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-2 p-4">
                          <InstrumentBadge instrument={course.instrument} className="w-fit" />
                          <p className="line-clamp-2 font-heading text-sm font-medium">
                            {course.title}
                          </p>
                          <p className="font-mono text-xs font-medium tabular-nums">
                            {formatRupiah(course.price)}
                          </p>
                        </div>
                      </Link>
                    </StaggerItem>
                    );
                  })}
                </Stagger>
                )}
              </section>
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

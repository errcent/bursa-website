"use client";

import Link from "next/link";
import { ArrowRight, Compass, RefreshCw, UserRound } from "lucide-react";

import { CourseCard } from "@/components/course-card";
import { MentorCard } from "@/components/mentor-card";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import type { LearningGuidanceResult } from "@/lib/learning/guidance/types";

export function GuidanceResults({
  result,
  saved,
  onRetake,
}: {
  result: LearningGuidanceResult;
  saved: boolean;
  onRetake: () => void;
}) {
  return (
    <div className="flex flex-col gap-10">
      <Reveal>
        <div className="surface-card flex flex-col gap-4 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-soft via-surface-2 to-background">
              <Compass className="size-5 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="eyebrow mb-1">Jalur Belajar Kamu</p>
              <h2 className="font-heading text-xl font-medium">{result.pathTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
              {saved ? (
                <p className="mt-3 text-xs text-accent">Profil belajar tersimpan di akunmu.</p>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  <Link href="/masuk?next=/panduan-belajar" className="link-accent">
                    Masuk
                  </Link>{" "}
                  untuk menyimpan rekomendasi ini.
                </p>
              )}
            </div>
          </div>
          <ol className="flex flex-col gap-2 border-t border-border/60 pt-4">
            {result.pathSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm text-muted-foreground">
                <span className="font-mono text-xs font-medium text-accent">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>

      <section>
        <Reveal className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="section-title">Kelas yang Direkomendasikan</h3>
          <Link href="/katalog" className="link-accent text-sm">
            Lihat semua kelas
          </Link>
        </Reveal>
        {result.courses.length === 0 ? (
          <div className="surface-card p-6 text-sm text-muted-foreground">
            Belum ada kelas yang cocok di katalog untuk kombinasi ini. Coba jelajahi{" "}
            <Link href="/katalog" className="link-accent">
              katalog
            </Link>{" "}
            secara manual.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {result.courses.map(({ course, reasons }) => (
              <div key={course.slug} className="flex flex-col gap-2">
                <CourseCard course={course} />
                {reasons.length > 0 ? (
                  <ul className="px-1 text-xs text-muted-foreground">
                    {reasons.map((reason) => (
                      <li key={reason}>• {reason}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <Reveal className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="section-title flex items-center gap-2">
            <UserRound className="size-4 text-accent" />
            Mentor yang Cocok
          </h3>
          <Link href="/katalog?view=instruktur" className="link-accent text-sm">
            Lihat semua mentor
          </Link>
        </Reveal>
        {result.mentors.length === 0 ? (
          <div className="surface-card p-6 text-sm text-muted-foreground">
            Belum ada mentor terverifikasi untuk instrumen ini.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.mentors.map(({ mentor, reasons }) => (
              <div key={mentor.slug} className="flex flex-col gap-2">
                <MentorCard mentor={mentor} />
                {reasons.length > 0 ? (
                  <ul className="px-1 text-xs text-muted-foreground">
                    {reasons.map((reason) => (
                      <li key={reason}>• {reason}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <Reveal className="flex flex-wrap gap-3">
        <Button render={<Link href="/dashboard" />} className="btn-primary">
          Ke Dashboard
          <ArrowRight className="size-4" />
        </Button>
        <Button variant="outline" onClick={onRetake}>
          <RefreshCw className="size-4" />
          Ulangi Kuis
        </Button>
      </Reveal>
    </div>
  );
}

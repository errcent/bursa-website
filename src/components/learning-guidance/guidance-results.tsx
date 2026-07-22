"use client";

import Link from "next/link";
import { ArrowRight, Compass, RefreshCw, UserRound } from "lucide-react";

import { CourseCard } from "@/components/course-card";
import { MentorCard } from "@/components/mentor-card";
import {
  GuidanceMentorCarousel,
  GuidanceReasonTags,
} from "@/components/learning-guidance/guidance-mentor-carousel";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import type { LearningGuidanceResult } from "@/lib/learning/guidance/types";
import type { Instrument } from "@/lib/types";

const INSTRUMENT_UI: Record<string, Instrument> = {
  SAHAM: "Saham",
  CRYPTO: "Crypto",
  FOREX: "Forex",
};

function ReasonTags({ reasons }: { reasons: string[] }) {
  return <GuidanceReasonTags reasons={reasons} />;
}

export function GuidanceResults({
  result,
  saved,
  onRetake,
  isLoggedIn,
}: {
  result: LearningGuidanceResult;
  saved: boolean;
  onRetake: () => void;
  isLoggedIn: boolean;
}) {
  const instrumentUi = result.profile?.instrument
    ? INSTRUMENT_UI[result.profile.instrument] ?? result.courses[0]?.course.instrument
    : result.courses[0]?.course.instrument;
  const katalogHref = instrumentUi
    ? `/katalog?q=${encodeURIComponent(instrumentUi)}`
    : "/katalog";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 pb-[env(safe-area-inset-bottom,0px)] sm:gap-12">
      <Reveal>
        <div className="surface-card flex flex-col gap-5 p-5 sm:gap-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-accent-soft/50">
              <Compass className="size-5 text-accent" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="eyebrow-tight">Jalur belajar kamu</p>
              <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                {result.pathTitle}
              </h2>
              <p className="section-copy">{result.summary}</p>
              {saved ? (
                <p className="text-xs font-medium text-accent">Profil belajar tersimpan di akunmu.</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  <Link href="/masuk?next=/panduan-belajar" className="link-accent">
                    Masuk
                  </Link>{" "}
                  untuk menyimpan jawaban dan rekomendasi ini.
                </p>
              )}
            </div>
          </div>

          <ol className="flex flex-col gap-3 border-t border-border/60 pt-5">
            {result.pathSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent-soft/60 font-mono text-[11px] font-semibold text-accent"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>

      <section className="space-y-4">
        <Reveal className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="section-title">Kelas yang direkomendasikan</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Diurutkan berdasarkan kecocokan profil, bukan harga.
            </p>
          </div>
          <Link href={katalogHref} className="link-accent shrink-0 text-sm">
            Lihat di katalog
          </Link>
        </Reveal>
        {result.courses.length === 0 ? (
          <div className="surface-card p-6 text-sm leading-relaxed text-muted-foreground">
            Belum ada kelas yang cocok di katalog untuk kombinasi ini. Coba jelajahi{" "}
            <Link href={katalogHref} className="link-accent">
              katalog
            </Link>{" "}
            secara manual.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {result.courses.map(({ course, reasons }) => (
              <div key={course.slug} className="flex flex-col gap-2.5">
                <CourseCard course={course} />
                <ReasonTags reasons={reasons} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <Reveal className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="section-title flex items-center gap-2">
              <UserRound className="size-4 text-accent" aria-hidden />
              Mentor yang cocok
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Mentor terverifikasi untuk instrumen pilihanmu.
            </p>
          </div>
          <Link href="/katalog?view=instruktur" className="link-accent shrink-0 text-sm">
            Lihat semua mentor
          </Link>
        </Reveal>
        {result.mentors.length === 0 ? (
          <div className="surface-card p-6 text-sm text-muted-foreground">
            Belum ada mentor terverifikasi untuk instrumen ini.
          </div>
        ) : (
          <>
            <div className="md:hidden">
              <GuidanceMentorCarousel mentors={result.mentors} />
            </div>
            <div className="hidden gap-5 md:grid md:grid-cols-2 lg:grid-cols-3">
              {result.mentors.map(({ mentor, reasons }) => (
                <div key={mentor.slug} className="flex flex-col gap-2.5">
                  <MentorCard mentor={mentor} />
                  <ReasonTags reasons={reasons} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <Reveal>
        <div className="rounded-2xl border border-border/60 bg-accent-soft/20 p-5 sm:p-6">
          <p className="text-sm font-medium text-foreground/90">Catatan edukasi</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Rekomendasi ini membantu mempersempit pilihan berdasarkan jawaban kuis — bukan saran
            investasi, prediksi pasar, atau jaminan hasil trading. Keputusan akhir tetap di tangan
            kamu; evaluasi ulang profil jika tujuan atau toleransi risikomu berubah.
          </p>
        </div>
      </Reveal>

      <Reveal className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button render={<Link href={katalogHref} />} className="btn-primary w-full sm:w-auto">
          Jelajahi kelas di katalog
          <ArrowRight className="size-4" />
        </Button>
        {isLoggedIn ? (
          <Button render={<Link href="/dashboard" />} variant="outline" className="w-full sm:w-auto">
            Ke dashboard
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onRetake} className="w-full sm:w-auto">
          <RefreshCw className="size-4" />
          Ulangi kuis
        </Button>
      </Reveal>
    </div>
  );
}

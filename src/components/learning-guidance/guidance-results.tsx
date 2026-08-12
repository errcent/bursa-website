"use client";

import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";

import { CourseCard } from "@/components/course-card";
import { GuidanceReasonTags } from "@/components/learning-guidance/guidance-mentor-carousel";
import { PlaylistCard } from "@/components/playlist/playlist-card";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import type { LearningGuidanceResult } from "@/lib/learning/guidance/types";
import { PREVIEW_CATALOG_COPY } from "@/lib/preview-catalog/copy";
import type { Instrument } from "@/lib/types";

const INSTRUMENT_UI: Record<string, Instrument> = {
  SAHAM: "Saham",
  CRYPTO: "Crypto",
  FOREX: "Forex",
};

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
  const showPreviewNote = process.env.NEXT_PUBLIC_CHECKOUT_ENABLED !== "true";
  const playlists = result.playlists ?? [];
  const profileTags = result.profileTags ?? [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 pb-[env(safe-area-inset-bottom,0px)] sm:gap-14">
      <Reveal>
        <header className="space-y-4 border-b border-border/50 pb-8">
          <p className="eyebrow-tight text-muted-foreground">Profil belajar</p>
          <div className="space-y-3">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {result.pathTitle}
            </h2>
            {result.summary ? (
              <p className="max-w-xl text-sm text-muted-foreground sm:text-[0.9375rem]">
                {result.summary}
              </p>
            ) : null}
          </div>
          {profileTags.length > 0 ? (
            <ul className="flex flex-wrap gap-2 pt-1">
              {profileTags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-md border border-border/70 bg-surface/40 px-2.5 py-1 text-xs font-medium text-foreground/80"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
          {!saved && !isLoggedIn ? (
            <p className="text-xs text-muted-foreground">
              <Link href="/masuk?next=/panduan-belajar/quiz" className="link-accent">
                Masuk
              </Link>{" "}
              untuk menyimpan profil ini.
            </p>
          ) : saved ? (
            <p className="text-xs font-medium text-accent">Tersimpan di akunmu.</p>
          ) : null}
        </header>
      </Reveal>

      <section className="space-y-5">
        <Reveal className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="section-title">Kelas</h3>
            {showPreviewNote ? (
              <p className="mt-1 text-xs text-muted-foreground">{PREVIEW_CATALOG_COPY.resultsNote}</p>
            ) : null}
          </div>
          <Link href={katalogHref} className="link-accent shrink-0 text-sm">
            Katalog
          </Link>
        </Reveal>
        {result.courses.length === 0 ? (
          <div className="border-y border-border/60 py-8 text-sm text-muted-foreground">
            Belum ada kelas yang cocok. Jelajahi{" "}
            <Link href={katalogHref} className="link-accent">
              katalog
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {result.courses.map(({ course, reasons }) => (
              <div key={course.slug} className="flex flex-col gap-2.5">
                <CourseCard course={course} hideBookmark />
                <GuidanceReasonTags reasons={reasons.slice(0, 2)} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <Reveal className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="section-title">Playlist</h3>
          <Link href="/katalog" className="link-accent shrink-0 text-sm">
            Semua playlist
          </Link>
        </Reveal>
        {playlists.length === 0 ? (
          <div className="border-y border-border/60 py-8 text-sm text-muted-foreground">
            Belum ada playlist yang cocok untuk profil ini.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {playlists.map(({ playlist, reasons }) => (
              <div key={playlist.id} className="flex flex-col gap-2.5">
                <PlaylistCard playlist={playlist} variant="catalog" hideBookmark />
                <GuidanceReasonTags reasons={reasons} />
              </div>
            ))}
          </div>
        )}
      </section>

      <Reveal className="flex flex-col gap-4 border-t border-border/50 pt-8">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Rekomendasi berdasarkan jawaban kuis. Bukan saran investasi atau jaminan hasil.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button render={<Link href={katalogHref} />} className="btn-primary w-full sm:w-auto">
            Jelajahi katalog
            <ArrowRight className="size-4" />
          </Button>
          {isLoggedIn ? (
            <Button
              render={<Link href="/dashboard" />}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Dashboard
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onRetake} className="w-full sm:w-auto">
            <RefreshCw className="size-4" />
            Ulangi kuis
          </Button>
        </div>
      </Reveal>
    </div>
  );
}

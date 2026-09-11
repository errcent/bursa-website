"use client";

import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";

import { GuidanceHeroCoverflow } from "@/components/learning-guidance/guidance-hero-coverflow";
import { GuidanceSupportingCarousel } from "@/components/learning-guidance/guidance-supporting-carousel";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { mergeGuidancePicks, splitGuidancePicks } from "@/lib/learning/guidance/picks";
import type { LearningGuidanceResult } from "@/lib/learning/guidance/types";
import type { Instrument } from "@/lib/types";

function resolveResultTiers(result: LearningGuidanceResult) {
  if (result.primary?.length || result.supporting?.length) {
    return { primary: result.primary ?? [], supporting: result.supporting ?? [] };
  }
  const merged = mergeGuidancePicks(result.courses ?? [], result.playlists ?? []);
  return splitGuidancePicks(merged);
}

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
    ? (INSTRUMENT_UI[result.profile.instrument] ?? result.courses[0]?.course.instrument)
    : result.courses[0]?.course.instrument;

  const katalogHref = instrumentUi
    ? `/katalog?q=${encodeURIComponent(instrumentUi)}`
    : "/katalog";

  const { primary, supporting } = resolveResultTiers(result);
  const hasAny = primary.length > 0 || supporting.length > 0;

  const katalogLink = (
    <Link href={katalogHref} className="link-accent mt-2 inline-flex items-center gap-1 text-sm font-medium">
      Lihat katalog
      <ArrowRight className="size-3.5" />
    </Link>
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-20 pb-[env(safe-area-inset-bottom,0px)] sm:gap-28">
      <Reveal>
        <header className="space-y-2 px-1">
          {result.summary ? (
            <p className="section-copy max-w-2xl text-base leading-relaxed text-foreground/90">
              {result.summary}
            </p>
          ) : null}
          {saved ? (
            <p className="text-xs font-medium text-accent">Tersimpan di akunmu.</p>
          ) : !isLoggedIn ? (
            <p className="text-xs text-muted-foreground">
              Demo publik: hasil quiz tersimpan sementara di browser ini.
            </p>
          ) : null}
        </header>
      </Reveal>

      {!hasAny ? (
        <Reveal>
          <div className="border-y border-border/60 py-8 text-sm text-muted-foreground">
            Belum ada rekomendasi yang cukup selaras. Jelajahi{" "}
            <Link href={katalogHref} className="link-accent">
              katalog
            </Link>
            .
          </div>
        </Reveal>
      ) : null}

      {primary.length > 0 ? (
        <Reveal className="relative left-1/2 w-[100vw] max-w-none -translate-x-1/2 px-0">
          <GuidanceHeroCoverflow picks={primary} className="rounded-none border-x-0 sm:mx-auto sm:max-w-[min(100vw,1280px)] sm:rounded-2xl sm:border-x" />
        </Reveal>
      ) : null}

      {supporting.length > 0 ? (
        <section className="relative left-1/2 w-[100vw] max-w-none -translate-x-1/2 px-0 sm:static sm:w-full sm:translate-x-0">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-1">
            <GuidanceSupportingCarousel picks={supporting} sectionLink={katalogLink} />
          </div>
        </section>
      ) : null}

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
            <Button render={<Link href="/dashboard" />} variant="outline" className="w-full sm:w-auto">
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

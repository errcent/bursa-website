"use client";

import { ArrowRight, Compass, Loader2 } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import type { LearningGuidanceResult } from "@/lib/learning/guidance/types";

function RecommendationPreview({
  label,
  result,
}: {
  label: string;
  result: LearningGuidanceResult;
}) {
  const courseNames = result.courses.slice(0, 3).map(({ course }) => course.title);
  const extraCourses = result.courses.length - courseNames.length;

  return (
    <div className="surface-card flex flex-col gap-3 rounded-xl border border-border/80 p-4 sm:p-5">
      <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-accent-soft/40">
          <Compass className="size-4 text-accent" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="font-heading text-base font-semibold leading-snug">{result.pathTitle}</p>
          <p className="line-clamp-2 text-sm text-muted-foreground">{result.summary}</p>
        </div>
      </div>
      {courseNames.length > 0 ? (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {courseNames.map((title) => (
            <li key={title} className="line-clamp-1">
              · {title}
            </li>
          ))}
          {extraCourses > 0 ? <li>· +{extraCourses} kelas lainnya</li> : null}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Belum ada kelas yang cocok.</p>
      )}
    </div>
  );
}

export function GuidanceSaveChoice({
  savedResult,
  pendingResult,
  choosing,
  onKeepSaved,
  onUsePending,
}: {
  savedResult: LearningGuidanceResult;
  pendingResult: LearningGuidanceResult;
  choosing: boolean;
  onKeepSaved: () => void;
  onUsePending: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-[env(safe-area-inset-bottom,0px)] sm:gap-8">
      <Reveal>
        <div className="space-y-2 text-center sm:text-left">
          <p className="eyebrow-tight">Rekomendasi berbeda</p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Mau pakai rekomendasi yang mana?
          </h2>
          <p className="section-copy">
            Jawaban kuis barumu menghasilkan jalur belajar yang berbeda dari profil tersimpan di
            akunmu. Pilih salah satu — keduanya tetap bisa kamu ubah lagi nanti lewat kuis ulang.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2">
        <Reveal delay={0.05}>
          <RecommendationPreview label="Rekomendasi lama" result={savedResult} />
        </Reveal>
        <Reveal delay={0.1}>
          <RecommendationPreview label="Rekomendasi baru" result={pendingResult} />
        </Reveal>
      </div>

      <Reveal delay={0.15}>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={choosing}
            onClick={onKeepSaved}
          >
            Tetap rekomendasi lama
          </Button>
          <Button className="btn-primary w-full sm:w-auto" disabled={choosing} onClick={onUsePending}>
            {choosing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Menyimpan…
              </>
            ) : (
              <>
                Pakai rekomendasi baru
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </Reveal>
    </div>
  );
}

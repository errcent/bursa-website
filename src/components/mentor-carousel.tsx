"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";

import type { Mentor } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MentorCarouselProps {
  mentors: Mentor[];
  className?: string;
}

type StageDepth = 0 | 1 | 2;

/** Front-of-stage figures render above their neighbors; deterministic, not random. */
const STAGE_Z_INDEX: Record<StageDepth, number> = { 0: 3, 1: 2, 2: 1 };

/**
 * Figures are laid out in a repeating "stage" cycle: the middle of each cycle
 * is in full focus, the outer edges recede — like a lineup under a spotlight.
 * Purely positional, so the pattern is identical on every render/breakpoint.
 */
function getStageDepth(positionInCycle: number, cycleLength: number): StageDepth {
  if (cycleLength <= 2) return 0;
  const center = (cycleLength - 1) / 2;
  const distance = Math.abs(positionInCycle - center) / center;
  if (distance <= 0.34) return 0;
  if (distance <= 0.67) return 1;
  return 2;
}

function getMentorCredential(mentor: Mentor): string {
  if (mentor.licenseLabel?.includes("OJK")) return "Terdaftar WPPE-OJK";
  if (mentor.licenseLabel?.includes("Bappebti")) return "Sertifikasi Bappebti";
  if (mentor.licenseLabel) return mentor.licenseLabel;
  return `${mentor.instruments[0]} · ${mentor.yearsExperience} th pengalaman`;
}

function formatCompactCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "").replace(".", ",")}jt`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "").replace(".", ",")}rb`;
  }
  return String(value);
}

function MentorStageFigure({
  mentor,
  depth,
  zIndex,
}: {
  mentor: Mentor;
  depth: StageDepth;
  zIndex: number;
}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    mentor.cutoutUrl ? "loading" : "error"
  );

  return (
    <Link
      href={`/instruktur/${mentor.slug}`}
      className="mentor-stage-item"
      style={{ zIndex }}
      aria-label={`Lihat profil ${mentor.name} — ${mentor.title}`}
    >
      <span className="mentor-stage-figure" data-depth={depth}>
        {mentor.cutoutUrl && status !== "error" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mentor.cutoutUrl}
            alt=""
            className={cn(
              "mentor-stage-cutout",
              status === "loaded" ? "is-loaded" : "is-loading"
            )}
            draggable={false}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
          />
        ) : null}
        {status !== "loaded" ? (
          <span className="mentor-stage-skeleton" aria-hidden>
            {status === "error" ? mentor.initials : null}
          </span>
        ) : null}
      </span>

      <span className="mentor-stage-caption">
        <span className="mentor-stage-name line-clamp-1">{mentor.name}</span>
        <span className="mentor-stage-credential line-clamp-1">
          {getMentorCredential(mentor)}
        </span>
      </span>
    </Link>
  );
}

export function MentorCarousel({ mentors, className }: MentorCarouselProps) {
  const [isPaused, setIsPaused] = useState(false);

  if (mentors.length === 0) return null;

  const loopItems = [...mentors, ...mentors];
  const studentsTotal = mentors.reduce((sum, m) => sum + m.studentsCount, 0);
  const ojkCount = mentors.filter((m) => m.licenseLabel?.includes("OJK")).length;

  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  return (
    <div className={cn("relative", className)}>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Panggung mentor</p>
          <h2 className="section-title sm:text-3xl">Sosok di balik kelas yang kamu ikuti</h2>
          <p className="section-copy mt-2 max-w-lg">
            Setiap mentor melewati verifikasi kredensial — lisensi WPPE-OJK untuk saham,
            sertifikasi Bappebti untuk kripto — sebelum kelasnya tayang di katalog.
          </p>
          <p className="mentor-stage-stats mt-3">
            <ShieldCheck className="size-3.5 text-accent" strokeWidth={2} aria-hidden />
            {mentors.length} mentor · {formatCompactCount(studentsTotal)} murid ·{" "}
            {ojkCount} terdaftar OJK
          </p>
          <Link
            href="/katalog?view=instruktur"
            className="link-accent mt-3 inline-flex items-center gap-1 text-sm"
          >
            Buka katalog mentor
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <div
        className="mentor-stage"
        aria-label="Panggung mentor terverifikasi"
        role="region"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
        onTouchCancel={resume}
        onFocus={pause}
        onBlur={resume}
      >
        <div
          className="mentor-stage-track"
          style={{ animationPlayState: isPaused ? "paused" : "running" }}
        >
          {loopItems.map((mentor, index) => {
            const positionInCycle = index % mentors.length;
            const depth = getStageDepth(positionInCycle, mentors.length);
            return (
              <MentorStageFigure
                key={`${mentor.slug}-${index}`}
                mentor={mentor}
                depth={depth}
                zIndex={STAGE_Z_INDEX[depth]}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

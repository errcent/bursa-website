"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

import type { Mentor } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MentorCarouselProps {
  mentors: Mentor[];
  className?: string;
}

function MentorMarqueeFigure({ mentor, index }: { mentor: Mentor; index: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = mentor.avatarUrl && !imageFailed;

  return (
    <Link
      href={`/instruktur/${mentor.slug}`}
      className="mentor-marquee-item group"
      style={{ zIndex: index % 12 }}
      aria-label={`Profil ${mentor.name}`}
    >
      <div className="mentor-marquee-figure">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mentor.avatarUrl}
            alt=""
            className="mentor-marquee-image"
            draggable={false}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="mentor-marquee-fallback" aria-hidden>
            {mentor.initials}
          </div>
        )}
      </div>
      <span className="mentor-marquee-label line-clamp-1">{mentor.name}</span>
    </Link>
  );
}

export function MentorCarousel({ mentors, className }: MentorCarouselProps) {
  if (mentors.length === 0) return null;

  const loopItems = [...mentors, ...mentors];

  return (
    <div className={cn("relative", className)}>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Mentor</p>
          <h2 className="section-title sm:text-3xl">Mentor terverifikasi</h2>
          <p className="section-copy mt-2 max-w-lg">
            Praktisi saham, crypto, dan forex yang sudah lolos proses verifikasi.
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
        className="mentor-marquee"
        aria-label="Mentor terverifikasi"
        role="region"
      >
        <div className="mentor-marquee-track">
          {loopItems.map((mentor, index) => (
            <MentorMarqueeFigure
              key={`${mentor.slug}-${index}`}
              mentor={mentor}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

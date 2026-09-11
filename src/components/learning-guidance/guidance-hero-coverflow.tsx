"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { GuidancePickThumbnail } from "@/components/learning-guidance/guidance-pick-thumbnail";
import {
  guidancePickHref,
  guidancePickKey,
  guidancePickReason,
  guidancePickTitle,
} from "@/lib/learning/guidance/pick-presenters";
import type { ScoredGuidancePick } from "@/lib/learning/guidance/types";
import { useMobileLayout } from "@/hooks/use-mobile-layout";
import { cn } from "@/lib/utils";

export function GuidanceHeroCoverflow({
  picks,
  className,
}: {
  picks: ScoredGuidancePick[];
  className?: string;
}) {
  const isMobile = useMobileLayout();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const total = picks.length;
  const sideOffset = isMobile ? 150 : 340;
  const farOffset = isMobile ? 260 : 620;
  const cardWidth = isMobile ? "min(94vw, 360px)" : "min(92vw, 720px)";

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx % total);
  };

  useEffect(() => {
    if (isHovered || total <= 1) return;
    const interval = setInterval(nextSlide, 7000);
    return () => clearInterval(interval);
  }, [isHovered, nextSlide, total]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") prevSlide();
      if (event.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  if (picks.length === 0) return null;

  const active = picks[currentIndex]!;
  const activeReason = guidancePickReason(active);

  return (
    <section
      className={cn(
        "guidance-hero-coverflow relative isolate w-full overflow-hidden border-y border-border/40 bg-surface-1 py-10 sm:border sm:py-14",
        className
      )}
      aria-label="Rekomendasi utama"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? 0;
      }}
      onTouchEnd={(event) => {
        const diff = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
        if (Math.abs(diff) > 45) {
          if (diff < 0) nextSlide();
          else prevSlide();
        }
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-40">
        <div className="absolute inset-0 scale-110 blur-3xl">
          <GuidancePickThumbnail pick={active} withScrim={false} fillSlot className="h-full w-full" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/60 to-background" />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center px-3 sm:px-6 lg:px-10">
        <div className="mb-8 flex items-center gap-3 sm:mb-10">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-accent/70 sm:w-16" aria-hidden />
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-accent sm:text-xs">
            Rekomendasi utama
          </p>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-accent/70 sm:w-16" aria-hidden />
        </div>

        <div
          className="relative mb-8 flex w-full max-w-[1400px] items-center justify-center sm:mb-10"
          style={{
            perspective: "1600px",
            height: isMobile ? "240px" : "420px",
          }}
        >
          {picks.map((pick, idx) => {
            const offset = (idx - currentIndex + total) % total;
            let transform = "translateX(0px) scale(0.4) rotateY(0deg)";
            let opacity = 0;
            let zIndex = 0;
            let filter = "brightness(0.45)";
            let isCenter = false;

            if (offset === 0) {
              isCenter = true;
              transform = "translateX(0px) scale(1) rotateY(0deg)";
              opacity = 1;
              zIndex = 30;
              filter = "brightness(1)";
            } else if (offset === 1) {
              transform = `translateX(${sideOffset}px) scale(0.78) rotateY(-26deg)`;
              opacity = 0.62;
              zIndex = 20;
              filter = "brightness(0.78)";
            } else if (offset === 2) {
              transform = `translateX(${farOffset}px) scale(0.62) rotateY(-38deg)`;
              opacity = 0.34;
              zIndex = 10;
            } else if (offset === total - 1) {
              transform = `translateX(-${sideOffset}px) scale(0.78) rotateY(26deg)`;
              opacity = 0.62;
              zIndex = 20;
              filter = "brightness(0.78)";
            } else if (offset === total - 2) {
              transform = `translateX(-${farOffset}px) scale(0.62) rotateY(38deg)`;
              opacity = 0.34;
              zIndex = 10;
            }

            const href = guidancePickHref(pick);
            const title = guidancePickTitle(pick);
            return (
              <div
                key={guidancePickKey(pick)}
                className={cn(
                  "absolute overflow-hidden rounded-2xl border border-border/70 bg-surface-2 shadow-2xl transition-all duration-700 ease-out",
                  isCenter ? "shadow-accent/20 ring-1 ring-accent/25" : "cursor-pointer"
                )}
                style={{
                  width: cardWidth,
                  aspectRatio: "16 / 9",
                  transform,
                  opacity,
                  zIndex,
                  filter,
                  transformStyle: "preserve-3d",
                }}
                onClick={() => {
                  if (!isCenter) goToSlide(idx);
                }}
              >
                <div className="absolute inset-0 z-0">
                  <GuidancePickThumbnail pick={pick} withScrim fillSlot className="h-full w-full" />
                </div>

                <div
                  className={cn(
                    "relative z-10 flex h-full flex-col justify-end p-4 sm:p-6",
                    isCenter ? "opacity-100" : "pointer-events-none opacity-0"
                  )}
                >
                  <h3 className="guidance-balanced-title mx-auto max-w-[26ch] text-center font-heading text-xl font-semibold leading-snug text-white drop-shadow-sm sm:text-2xl lg:max-w-[30ch] lg:text-[1.65rem]">
                    {title}
                  </h3>
                  {isCenter && activeReason ? (
                    <p className="guidance-balanced-copy mx-auto mt-2 max-w-[34ch] text-center text-sm text-white/85 drop-shadow-sm">
                      {activeReason}
                    </p>
                  ) : null}
                  {isCenter ? (
                    <Link
                      href={href}
                      className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-accent-foreground transition hover:opacity-90"
                    >
                      Lihat detail
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Rekomendasi sebelumnya"
              className="absolute left-3 top-[52%] z-40 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/85 text-foreground backdrop-blur-sm transition hover:bg-background sm:left-6 lg:left-10"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Rekomendasi berikutnya"
              className="absolute right-3 top-[52%] z-40 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/85 text-foreground backdrop-blur-sm transition hover:bg-background sm:right-6 lg:right-10"
            >
              <ChevronRight className="size-5" />
            </button>

            <div className="flex items-center gap-2">
              {picks.map((pick, idx) => (
                <button
                  key={guidancePickKey(pick)}
                  type="button"
                  aria-label={`Rekomendasi ${idx + 1}`}
                  aria-current={idx === currentIndex}
                  onClick={() => goToSlide(idx)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    idx === currentIndex
                      ? "w-7 bg-accent"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

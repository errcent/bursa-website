"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PlaylistCarousel } from "@/components/playlist/playlist-carousel";
import { WordReveal } from "@/components/motion/word-reveal";
import { Button } from "@/components/ui/button";
import type { PlaylistSummary } from "@/lib/playlist/types";
import { cn } from "@/lib/utils";

interface HomeDiscoverSectionProps {
  playlists: PlaylistSummary[];
  className?: string;
}

export function HomeDiscoverSection({
  playlists,
  className,
}: HomeDiscoverSectionProps) {
  if (playlists.length === 0) return null;

  return (
    <div className={cn("home-discover-section relative min-w-0", className)}>
      <div className="discover-shell">
        <div className="discover-shell__header">
          <div className="discover-shell__copy min-w-0">
            <p className="eyebrow-tight mb-3">Ragam Playlist</p>
            <WordReveal
              as="h2"
              className="section-display-title text-foreground"
              text="Banyak jalur, satu platform"
              trigger="immediate"
              delay={0.04}
            />
            <p className="section-copy mt-3 max-w-xl text-base leading-relaxed">
              Jalur belajar terkurasi lintas kelas dan mentor: forex, saham, kripto,
              disusun biar progresmu lebih runut.
            </p>
          </div>
        </div>

        <div className="discover-shell__content">
          <div className="discover-carousel-stage">
            <PlaylistCarousel playlists={playlists} hideBookmark discoverMode />
          </div>
        </div>

        <div className="discover-shell__footer">
          <Button
            size="lg"
            className="btn-primary h-11 rounded-md px-7"
            render={<Link href="/playlist" />}
          >
            <span className="inline-flex items-center gap-2">
              Jelajahi semua playlist
              <ArrowRight className="size-4" />
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

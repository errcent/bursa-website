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
      <div className="discover-solo-track">
        <div className="discover-solo-sticky">
          <div className="container-page">
            <div className="discover-copy mx-auto min-w-0 max-w-xl text-center">
              <WordReveal
                as="h2"
                className="discover-title section-display-title mx-auto text-center text-foreground"
                text="Tidak perlu menebak harus mulai dari mana."
                trigger="inView"
                delay={0.04}
              />
              <p className="section-copy mx-auto mt-3 max-w-md text-center text-base leading-relaxed">
                Beberapa pertanyaan singkat. Kelas pertamamu terlihat.
              </p>
            </div>
          </div>

          <div className="discover-filmstrip">
            <PlaylistCarousel playlists={playlists} hideBookmark discoverMode />
          </div>

          <div className="container-page">
            <div className="discover-cta">
              <Button
                size="lg"
                className="btn-primary h-11 rounded-md px-7"
                render={<Link href="/panduan-belajar" />}
              >
                <span className="inline-flex items-center gap-2">
                  Temukan jalur yang cocok untukmu
                  <ArrowRight className="size-4" />
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

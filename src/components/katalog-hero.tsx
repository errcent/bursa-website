"use client";

import Link from "next/link";
import { Compass } from "lucide-react";

import { HeroLivingBackground } from "@/components/hero-living-bg";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export function KatalogHero() {
  return (
    <div className="hero-cinematic katalog-hero-compact relative overflow-hidden border-b border-border/60 py-7 sm:py-16">
      <HeroLivingBackground />
      <div className="container-page relative z-10">
        <Reveal y={20}>
          <p className="eyebrow mb-1.5 sm:mb-3">Discovery</p>
          <h1 className="page-hero-title text-gradient">Katalog Belajar Trading</h1>
          <p className="section-copy mt-2 hidden max-w-2xl sm:mt-3 sm:block">
            Jelajahi semua kelas dan mentor dalam satu tempat. Gunakan pencarian untuk
            menemukan judul spesifik, atau geser antar tab untuk fokus ke kelas atau mentor.
          </p>
          <div className="mt-4 hidden sm:block">
            <Button
              render={<Link href="/panduan-belajar" />}
              variant="outline"
              className="border-accent/30 bg-accent/5 hover:bg-accent/10"
            >
              <Compass className="size-4 text-accent" />
              Belum tahu mulai dari mana? Ikuti panduan belajar
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

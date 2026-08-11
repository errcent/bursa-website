"use client";

import { Reveal } from "@/components/motion/reveal";

export function ProfileHero() {
  return (
    <div className="hero-cinematic page-header-strip border-b border-border/40">
      <div className="container-page py-12 sm:py-14">
        <Reveal>
          <p className="eyebrow mb-3">Identitas</p>
          <h1 className="page-hero-title max-w-2xl text-balance text-gradient">Profil</h1>
          <p className="section-copy mt-4 max-w-lg text-pretty">
            Foto, nama tampilan, dan bio yang terlihat di komunitas dan dashboard.
          </p>
        </Reveal>
      </div>
    </div>
  );
}

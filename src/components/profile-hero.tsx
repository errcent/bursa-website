"use client";

import { Reveal } from "@/components/motion/reveal";

export function ProfileHero() {
  return (
    <div className="hero-cinematic page-header-strip">
      <div className="container-page py-10 sm:py-12">
        <Reveal>
          <p className="eyebrow mb-2">Identitas</p>
          <h1 className="page-hero-title text-gradient">Profil</h1>
          <p className="section-copy mt-2 max-w-lg">
            Foto, nama tampilan, dan bio yang terlihat di komunitas dan dashboard.
          </p>
        </Reveal>
      </div>
    </div>
  );
}

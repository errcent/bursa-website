"use client";

import { Reveal } from "@/components/motion/reveal";

export function SettingsHero() {
  return (
    <div className="hero-cinematic page-header-strip">
      <div className="container-page py-10 sm:py-12">
        <Reveal>
          <p className="eyebrow mb-2">Preferensi</p>
          <h1 className="page-hero-title text-gradient">Pengaturan</h1>
          <p className="section-copy mt-2 max-w-lg">
            Kelola akun, pembayaran, keamanan, dan preferensi tampilan platform.
          </p>
        </Reveal>
      </div>
    </div>
  );
}

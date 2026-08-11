"use client";

import { Reveal } from "@/components/motion/reveal";

export function InfoPageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="hero-cinematic page-header-strip border-b border-border/40">
      <div className="container-page py-12 sm:py-16">
        <Reveal>
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h1 className="page-hero-title max-w-3xl text-balance text-gradient">{title}</h1>
          <p className="section-copy mt-4 max-w-2xl text-pretty">{description}</p>
        </Reveal>
      </div>
    </div>
  );
}

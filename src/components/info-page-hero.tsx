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
    <div className="hero-cinematic page-header-strip">
      <div className="container-page py-10 sm:py-12">
        <Reveal>
          <p className="eyebrow mb-2">{eyebrow}</p>
          <h1 className="page-hero-title text-gradient">{title}</h1>
          <p className="section-copy mt-2 max-w-2xl">{description}</p>
        </Reveal>
      </div>
    </div>
  );
}

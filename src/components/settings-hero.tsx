"use client";

import { Reveal } from "@/components/motion/reveal";
import { useLanguage } from "@/components/language-provider";

export function SettingsHero() {
  const { messages } = useLanguage();
  const t = messages.settings;

  return (
    <div className="hero-cinematic page-header-strip">
      <div className="container-page py-10 sm:py-12">
        <Reveal>
          <p className="eyebrow mb-2">{t.eyebrow}</p>
          <h1 className="page-hero-title text-gradient">{t.pageTitle}</h1>
          <p className="section-copy mt-2 max-w-lg">{t.description}</p>
        </Reveal>
      </div>
    </div>
  );
}

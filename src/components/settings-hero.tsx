"use client";

import { Reveal } from "@/components/motion/reveal";
import { useLanguage } from "@/components/language-provider";

export function SettingsHero() {
  const { messages } = useLanguage();

  return (
    <div className="hero-cinematic page-header-strip">
      <div className="container-page py-8 sm:py-10">
        <Reveal>
          <h1 className="page-hero-title text-gradient">{messages.settings.pageTitle}</h1>
        </Reveal>
      </div>
    </div>
  );
}

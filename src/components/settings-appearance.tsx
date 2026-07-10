"use client";

import { useLanguage } from "@/components/language-provider";
import { ThemeSelector } from "@/components/theme-selector";

export function SettingsAppearance() {
  const { messages } = useLanguage();
  const t = messages.settings.appearance;

  return (
    <section>
      <h2 className="section-title">{t.title}</h2>
      <p className="section-copy mt-1">{t.description}</p>
      <ThemeSelector className="mt-6" />
    </section>
  );
}

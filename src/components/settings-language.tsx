"use client";

import { motion } from "motion/react";

import { SettingsAppearance } from "@/components/settings-appearance";
import { useLanguage } from "@/components/language-provider";
import { LOCALES, type Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

const options: {
  value: Locale;
  flag: string;
  labelKey: "idLabel" | "enLabel";
  descriptionKey: "idDescription" | "enDescription";
}[] = [
  {
    value: "id",
    flag: "🇮🇩",
    labelKey: "idLabel",
    descriptionKey: "idDescription",
  },
  {
    value: "en",
    flag: "🇬🇧",
    labelKey: "enLabel",
    descriptionKey: "enDescription",
  },
];

function LanguageLocaleSelector({ className }: { className?: string }) {
  const { locale, setLocale, messages, mounted } = useLanguage();
  const t = messages.settings.language;

  if (!mounted) {
    return (
      <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
        {LOCALES.map((value) => (
          <div key={value} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {options.map((opt) => {
        const selected = locale === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            onClick={() => setLocale(opt.value)}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
              selected
                ? "border-accent/40 bg-accent-soft shadow-[0_0_24px_var(--glow)] ring-1 ring-accent/20"
                : "surface-card hover:border-accent/25"
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-xl" aria-hidden>
                {opt.flag}
              </span>
              {selected && (
                <span className="badge-pill border-accent/30 py-0.5 text-[10px]">
                  {messages.common.active}
                </span>
              )}
            </div>
            <div>
              <p className="font-heading text-sm font-medium">{t[opt.labelKey]}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t[opt.descriptionKey]}</p>
            </div>
          </motion.button>
        );
      })}
      <p className="col-span-full text-xs text-muted-foreground">
        {t.activeLocale}:{" "}
        <span className="text-foreground">{locale === "id" ? t.idLabel : t.enLabel}</span>
      </p>
    </div>
  );
}

export function SettingsLanguage() {
  const { messages } = useLanguage();
  const t = messages.settings.language;

  return (
    <section className="space-y-8">
      <div>
        <h2 className="section-title">{t.tabSectionTitle}</h2>
        <p className="section-copy mt-1">{t.tabSectionDescription}</p>
      </div>

      <div>
        <h3 className="text-sm font-medium">{t.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
        <LanguageLocaleSelector className="mt-4" />
      </div>

      <SettingsAppearance />
    </section>
  );
}

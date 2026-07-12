"use client";

import { SettingsAppearance } from "@/components/settings-appearance";
import { useLanguage } from "@/components/language-provider";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

const options: { value: Locale; flag: string; labelKey: "idLabel" | "enLabel" }[] = [
  { value: "id", flag: "🇮🇩", labelKey: "idLabel" },
  { value: "en", flag: "🇬🇧", labelKey: "enLabel" },
];

function LanguageLocaleSelector() {
  const { locale, setLocale, messages, mounted } = useLanguage();
  const t = messages.settings.language;

  if (!mounted) {
    return <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />;
  }

  return (
    <div className="inline-flex rounded-lg border border-border p-1">
      {options.map((opt) => {
        const selected = locale === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLocale(opt.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
              selected ? "bg-accent-soft font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span aria-hidden>{opt.flag}</span>
            {t[opt.labelKey]}
          </button>
        );
      })}
    </div>
  );
}

export function SettingsLanguage() {
  const { messages } = useLanguage();
  const t = messages.settings.language;
  const appearance = messages.settings.appearance;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-medium">{t.title}</h2>
        <LanguageLocaleSelector />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-medium">{appearance.title}</h2>
        <SettingsAppearance compact />
      </div>
    </section>
  );
}

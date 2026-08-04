"use client";

import { useLanguage } from "@/components/language-provider";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

const options: { value: Locale; flag: string; labelKey: "idLabel" | "enLabel"; descKey: "idDescription" | "enDescription" }[] = [
  { value: "id", flag: "🇮🇩", labelKey: "idLabel", descKey: "idDescription" },
  { value: "en", flag: "🇬🇧", labelKey: "enLabel", descKey: "enDescription" },
];

export function SettingsLanguage() {
  const { locale, setLocale, messages, mounted } = useLanguage();
  const t = messages.settings.language;

  if (!mounted) {
    return <div className="h-24 animate-pulse rounded-2xl bg-muted" />;
  }

  return (
    <div className="surface-card divide-y divide-border/60">
      {options.map((opt) => {
        const selected = locale === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLocale(opt.value)}
            className={cn(
              "flex w-full flex-col gap-1 px-4 py-4 text-left transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4",
              selected ? "bg-foreground/[0.03]" : "hover:bg-muted/30"
            )}
            aria-pressed={selected}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none" aria-hidden>
                {opt.flag}
              </span>
              <div>
                <p className="text-sm font-medium">{t[opt.labelKey]}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t[opt.descKey]}</p>
              </div>
            </div>
            <span
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center rounded-full border sm:ml-auto",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border/80 bg-transparent"
              )}
              aria-hidden
            >
              {selected ? (
                <span className="block size-1.5 rounded-full bg-background" />
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

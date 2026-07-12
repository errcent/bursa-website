"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";

const optionValues = ["dark", "light", "system"] as const;

export function ThemeSelector({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const { messages } = useLanguage();
  const t = messages.settings.theme;
  const [mounted, setMounted] = useState(false);

  const options = [
    { value: "dark" as const, label: t.dark, icon: Moon },
    { value: "light" as const, label: t.light, icon: Sun },
    { value: "system" as const, label: t.system, icon: Monitor },
  ];

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          compact ? "h-10 w-56 animate-pulse rounded-lg bg-muted" : "grid gap-3 sm:grid-cols-3",
          className
        )}
      />
    );
  }

  const active = theme ?? "dark";

  if (compact) {
    return (
      <div className={cn("inline-flex rounded-lg border border-border p-1", className)}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const selected = active === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                selected ? "bg-accent-soft font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const selected = active === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={cn(
              "flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-colors",
              selected
                ? "border-accent/40 bg-accent-soft font-medium"
                : "surface-card hover:border-accent/25"
            )}
          >
            <Icon className="size-4 text-muted-foreground" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

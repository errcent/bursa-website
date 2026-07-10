"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";

import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";

const optionValues = ["dark", "light", "system"] as const;

export function ThemeSelector({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { messages } = useLanguage();
  const t = messages.settings.theme;
  const [mounted, setMounted] = useState(false);

  const options = [
    { value: "dark" as const, label: t.dark, icon: Moon, description: t.darkDescription },
    { value: "light" as const, label: t.light, icon: Sun, description: t.lightDescription },
    { value: "system" as const, label: t.system, icon: Monitor, description: t.systemDescription },
  ];

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
        {optionValues.map((value) => (
          <div key={value} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  const active = theme ?? "dark";

  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const selected = active === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
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
              <Icon className="size-5 text-muted-foreground" />
              {selected && (
                <span className="badge-pill border-accent/30 py-0.5 text-[10px]">
                  {messages.common.active}
                </span>
              )}
            </div>
            <div>
              <p className="font-heading text-sm font-medium">{opt.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
            </div>
            {opt.value !== "system" && (
              <div
                className={cn(
                  "mt-auto h-8 w-full rounded-lg border border-border",
                  opt.value === "dark" ? "bg-[#0a0a0a]" : "bg-[#e8e9f0]"
                )}
              />
            )}
          </motion.button>
        );
      })}
      {resolvedTheme && (
        <p className="col-span-full text-xs text-muted-foreground">
          {t.activeTheme}:{" "}
          <span className="text-foreground">
            {resolvedTheme === "dark" ? t.resolvedDark : t.resolvedLight}
          </span>
        </p>
      )}
    </div>
  );
}

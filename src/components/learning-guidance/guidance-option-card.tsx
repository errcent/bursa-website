"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export function GuidanceOptionCard({
  label,
  description,
  selected,
  onSelect,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group flex w-full cursor-pointer items-start gap-3 rounded-[var(--atom-card-radius)] border p-4 text-left transition-all duration-200 sm:p-5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-accent/50 bg-accent-soft/40 shadow-[var(--atom-card-shadow)]"
          : "border-border/80 bg-surface/30 hover:border-foreground/12 hover:bg-surface/50"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border/80 bg-background/40 text-transparent group-hover:border-foreground/20"
        )}
        aria-hidden
      >
        <Check className="size-3 stroke-[2.5]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-heading text-sm font-medium tracking-tight sm:text-[0.9375rem]">
          {label}
        </span>
        {description ? (
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground sm:text-[0.8125rem]">
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}

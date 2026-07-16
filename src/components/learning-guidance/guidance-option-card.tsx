"use client";

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
      className={cn(
        "flex w-full cursor-pointer flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
        selected
          ? "border-accent/40 bg-accent/10 shadow-[0_0_20px_var(--glow)]"
          : "border-border bg-surface/40 hover:border-foreground/15"
      )}
    >
      <span className="font-heading text-sm font-medium">{label}</span>
      {description ? (
        <span className="text-xs leading-relaxed text-muted-foreground">{description}</span>
      ) : null}
    </button>
  );
}

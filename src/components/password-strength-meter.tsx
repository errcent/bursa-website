"use client";

import { cn } from "@/lib/utils";
import type { PasswordStrength } from "@/lib/auth/password-policy";

const STRENGTH_LABEL: Record<PasswordStrength, string> = {
  weak: "Lemah",
  fair: "Cukup",
  good: "Baik",
  strong: "Kuat",
};

const STRENGTH_COLOR: Record<PasswordStrength, string> = {
  weak: "bg-destructive",
  fair: "bg-amber-500",
  good: "bg-accent/80",
  strong: "bg-emerald-500",
};

export function PasswordStrengthMeter({
  strength,
  score,
  className,
}: {
  strength: PasswordStrength;
  score: number;
  className?: string;
}) {
  const segments = 4;
  const filled = Math.max(1, Math.round((score / 100) * segments));

  return (
    <div className={cn("space-y-2", className)} aria-live="polite">
      <div className="flex gap-1" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < filled ? STRENGTH_COLOR[strength] : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Kekuatan kata sandi:{" "}
        <span className="font-medium text-foreground">{STRENGTH_LABEL[strength]}</span>
      </p>
    </div>
  );
}

export function PasswordRequirements({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  return (
    <ul className="space-y-1 text-xs text-muted-foreground">
      {errors.map((err) => (
        <li key={err} className="flex items-start gap-1.5">
          <span className="mt-0.5 text-destructive" aria-hidden>
            •
          </span>
          {err}
        </li>
      ))}
    </ul>
  );
}

"use client";

import { cn } from "@/lib/utils";

export const labInputClassName =
  "w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-base outline-none backdrop-blur-sm transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-accent/40 focus:shadow-[0_0_20px_var(--glow)] disabled:opacity-50 sm:text-sm";

export function LabField({
  label,
  id,
  suffix,
  helperText,
  className,
  children,
}: {
  label: string;
  id: string;
  suffix?: string;
  helperText?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        {children}
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  );
}

export function LabNumberInput({
  id,
  value,
  onChange,
  suffix,
  min,
  max,
  step = "any",
  placeholder,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number | "any";
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      value={value}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(labInputClassName, suffix && "pr-12")}
    />
  );
}

export function LabResultTile({
  label,
  value,
  tone = "neutral",
  className,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4",
        tone === "positive" && "border-profit/30 bg-profit/5",
        tone === "negative" && "border-loss/30 bg-loss/5",
        className
      )}
    >
      <p className="stat-label">{label}</p>
      <p
        className={cn(
          "stat-value mt-1",
          tone === "positive" && "text-profit",
          tone === "negative" && "text-loss"
        )}
      >
        {value}
      </p>
    </div>
  );
}

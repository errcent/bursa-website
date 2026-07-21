"use client";

import { cn } from "@/lib/utils";

export const labInputClassName =
  "w-full rounded-xl border border-border/80 bg-surface/80 px-3.5 py-2.5 text-base outline-none backdrop-blur-sm transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground/70 focus:border-accent/45 focus:bg-surface focus:shadow-[0_0_24px_var(--glow)] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";

export const labTextareaClassName =
  "min-h-[88px] w-full resize-y rounded-xl border border-border/80 bg-surface/80 px-3.5 py-2.5 text-sm outline-none backdrop-blur-sm transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus:border-accent/45 focus:shadow-[0_0_24px_var(--glow)]";

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
      <label htmlFor={id} className="text-sm font-medium tracking-tight text-foreground/90">
        {label}
      </label>
      <div className="relative">
        {children}
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {helperText && <p className="text-xs leading-relaxed text-muted-foreground">{helperText}</p>}
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
      className={cn(labInputClassName, suffix && "pr-14")}
    />
  );
}

export function LabToolPanel({
  title,
  description,
  children,
  className,
  footer,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      {(title || description) && (
        <div className="border-b border-border/50 px-5 py-4 sm:px-6">
          {title && (
            <h3 className="font-heading text-base font-semibold tracking-tight sm:text-lg">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="p-5 sm:p-6">{children}</div>
      {footer && <div className="border-t border-border/50 px-5 py-4 sm:px-6">{footer}</div>}
    </div>
  );
}

export function LabResultGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>{children}</div>
  );
}

export function LabResultTile({
  label,
  value,
  tone = "neutral",
  className,
  hint,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
  className?: string;
  hint?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-4 transition-colors duration-200",
        tone === "positive" && "border-profit/35 bg-profit/[0.06]",
        tone === "negative" && "border-loss/35 bg-loss/[0.06]",
        className
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100",
          tone === "positive" && "via-profit/40",
          tone === "negative" && "via-loss/40"
        )}
      />
      <p className="stat-label">{label}</p>
      <p
        className={cn(
          "stat-value mt-1 tabular-nums",
          tone === "positive" && "text-profit",
          tone === "negative" && "text-loss"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function LabDirectionToggle({
  value,
  onChange,
  longLabel = "Long (Beli)",
  shortLabel = "Short (Jual)",
}: {
  value: "long" | "short";
  onChange: (value: "long" | "short") => void;
  longLabel?: string;
  shortLabel?: string;
}) {
  return (
    <div className="inline-flex rounded-xl border border-border/70 bg-muted/50 p-1">
      {(
        [
          { id: "long" as const, label: longLabel },
          { id: "short" as const, label: shortLabel },
        ] as const
      ).map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200",
            value === option.id
              ? option.id === "long"
                ? "bg-profit/15 text-profit shadow-sm"
                : "bg-loss/15 text-loss shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export const labInputClassName = "lab-input";

export const labTextareaClassName =
  "lab-input min-h-[96px] resize-y leading-relaxed";

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
      <label htmlFor={id} className="text-[13px] font-medium tracking-tight text-foreground/90">
        {label}
      </label>
      <div className="relative">
        {children}
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
            {suffix}
          </span>
        )}
      </div>
      {helperText && (
        <p className="text-xs leading-relaxed text-muted-foreground/85">{helperText}</p>
      )}
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

export function LabCheckbox({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/45 bg-muted/15 px-3.5 py-3 transition-colors hover:border-border/70 hover:bg-muted/25"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border-border/70 accent-accent"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground/90">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </label>
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
        <div className="lab-panel-header">
          {title && (
            <h3 className="font-heading text-base font-semibold tracking-tight sm:text-lg">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="lab-panel-body">{children}</div>
      {footer && (
        <div className="border-t border-border/45 px-5 py-4 sm:px-6">{footer}</div>
      )}
    </div>
  );
}

export function LabAssumptionsPanel({ items }: { items: string[] }) {
  return (
    <details className="group surface-card overflow-hidden">
      <summary className="cursor-pointer list-none px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold tracking-tight">Asumsi &amp; batasan perhitungan</p>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
        </div>
      </summary>
      <div className="border-t border-border/45 px-5 pb-5 sm:px-6 sm:pb-6">
        <ul className="flex flex-col gap-2.5 pt-4 text-sm leading-relaxed text-muted-foreground">
          {items.map((item) => (
            <li key={item} className="flex gap-2.5">
              <span
                aria-hidden
                className="mt-2 size-1 shrink-0 rounded-full bg-accent/50"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
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
    <div className={cn("mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {children}
    </div>
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
        "lab-result-tile",
        tone === "positive" && "border-profit/30 bg-profit/[0.05]",
        tone === "negative" && "border-loss/30 bg-loss/[0.05]",
        className
      )}
    >
      <p className="stat-label">{label}</p>
      <p
        className={cn(
          "stat-value mt-1 text-xl tabular-nums sm:text-2xl",
          tone === "positive" && "text-profit",
          tone === "negative" && "text-loss"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
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
    <div
      className="inline-flex rounded-xl border border-border/55 bg-muted/30 p-1"
      role="group"
      aria-label="Arah posisi"
    >
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
          aria-pressed={value === option.id}
          className={cn(
            "rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200",
            value === option.id
              ? option.id === "long"
                ? "bg-profit/12 text-profit shadow-sm"
                : "bg-loss/12 text-loss shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function LabTabsScroll({ children }: { children: React.ReactNode }) {
  return <div className="lab-tabs-scroll">{children}</div>;
}

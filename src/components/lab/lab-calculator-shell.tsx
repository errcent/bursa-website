"use client";

import { cn } from "@/lib/utils";

export function LabCalculatorShell({
  input,
  output,
  className,
}: {
  input: React.ReactNode;
  output: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start", className)}>
      <div className="min-w-0">{input}</div>
      <div className="min-w-0 lg:sticky lg:top-[calc(var(--site-header-offset)+1rem)] lg:max-h-[calc(100dvh-var(--site-header-offset)-2rem)] lg:overflow-y-auto lg:overscroll-contain">
        {output}
      </div>
    </div>
  );
}

export function LabOutputPanel({
  title = "Hasil",
  children,
  className,
  footer,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      <div className="border-b border-border/45 px-4 py-3 sm:px-5">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
      {footer && <div className="border-t border-border/45 px-4 py-3 sm:px-5">{footer}</div>}
    </div>
  );
}

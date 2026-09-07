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
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="min-w-0">{input}</div>
      <div className="min-w-0">{output}</div>
    </div>
  );
}

export function LabOutputPanel({
  title,
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
    <div className={cn("lab-output-panel surface-card overflow-hidden", className)}>
      {title ? (
        <div className="border-b border-border/45 px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        </div>
      ) : null}
      <div className="p-4 sm:p-5">{children}</div>
      {footer ? (
        <div className="border-t border-border/45 px-4 py-3 sm:px-5">{footer}</div>
      ) : null}
    </div>
  );
}

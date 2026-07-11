import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function StatCard({ label, value, hint, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "surface-card p-4",
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="size-4" />
        </div>
      </div>
      {(hint || trend) && (
        <p className="text-xs text-muted-foreground">
          {trend && <span className="text-emerald">{trend} </span>}
          {hint}
        </p>
      )}
    </div>
  );
}

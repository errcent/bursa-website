import { ShieldCheck, ShieldQuestion } from "lucide-react";

import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  verified: boolean;
  label?: string;
  className?: string;
}

export function VerifiedBadge({ verified, label, className }: VerifiedBadgeProps) {
  if (!verified) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground",
          className
        )}
      >
        <ShieldQuestion className="size-3.5" />
        {label ?? "Review Tim"}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-emerald/30 bg-emerald/10 px-2.5 py-1 text-xs font-medium text-emerald",
        className
      )}
    >
      <ShieldCheck className="size-3.5" />
      {label ?? "Dipublikasikan"}
    </span>
  );
}

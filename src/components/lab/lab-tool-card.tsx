import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";

import type { LabTool } from "@/lib/lab/tools";
import { cn } from "@/lib/utils";

const difficultyLabel = {
  pemula: "Pemula",
  menengah: "Menengah",
  lanjut: "Lanjut",
} as const;

export function LabToolCard({
  tool,
  compact = false,
}: {
  tool: LabTool;
  compact?: boolean;
}) {
  const Icon = tool.icon;

  return (
    <Link
      href={tool.href}
      className={cn(
        "surface-card group relative flex h-full flex-col overflow-hidden transition-colors hover:border-border/80",
        compact ? "gap-2 p-3.5" : "gap-3 p-4 sm:p-5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="lab-tool-card-icon">
          <Icon className="size-[18px]" />
        </span>
        <span className="rounded-md border border-border/50 bg-muted/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {tool.tag}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <h3
          className={cn(
            "font-heading font-semibold tracking-tight text-foreground group-hover:text-accent",
            compact ? "text-sm" : "text-base"
          )}
        >
          {tool.shortTitle ?? tool.title}
        </h3>
        {!compact && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {tool.description}
          </p>
        )}
      </div>

      <div className="flex items-end justify-between gap-3 border-t border-border/35 pt-2.5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {tool.difficulty && (
            <span className="rounded-md border border-border/50 bg-muted/15 px-2 py-0.5 text-[11px]">
              {difficultyLabel[tool.difficulty]}
            </span>
          )}
          {tool.timeEstimate && (
            <span className="inline-flex items-center gap-1 text-[11px]">
              <Clock className="size-3 opacity-70" />
              {tool.timeEstimate}
            </span>
          )}
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground/50 group-hover:text-accent" aria-hidden />
      </div>
    </Link>
  );
}

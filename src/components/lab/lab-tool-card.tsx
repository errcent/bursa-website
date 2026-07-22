import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";

import { HoverLift, Reveal } from "@/components/motion/reveal";
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
    <Reveal>
      <HoverLift>
        <Link
          href={tool.href}
          className={cn(
            "surface-card-hover group relative flex h-full flex-col overflow-hidden",
            compact ? "gap-3 p-4" : "gap-4 p-5 sm:p-6"
          )}
        >
          {tool.featured && (
            <span className="absolute left-0 top-0 rounded-br-xl border-b border-r border-accent/25 bg-accent-soft/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
              Unggulan
            </span>
          )}

          <div
            className={cn(
              "flex items-start justify-between gap-3",
              tool.featured && "pt-4"
            )}
          >
            <span className="lab-tool-card-icon">
              <Icon className="size-[18px]" />
            </span>
            <span className="rounded-md border border-border/50 bg-muted/25 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {tool.tag}
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <h3
              className={cn(
                "font-heading font-semibold tracking-tight text-foreground",
                compact ? "text-sm sm:text-[15px]" : "text-base sm:text-lg"
              )}
            >
              {tool.shortTitle ?? tool.title}
            </h3>
            {!compact && (
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground/90">
                {tool.description}
              </p>
            )}
          </div>

          <div className="flex items-end justify-between gap-3 border-t border-border/35 pt-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {tool.difficulty && (
                <span className="rounded-md border border-border/50 bg-muted/20 px-2 py-0.5 text-[11px]">
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
            <span
              className="inline-flex size-8 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-all duration-200 group-hover:border-accent/25 group-hover:bg-accent-soft/40 group-hover:text-accent"
              aria-hidden
            >
              <ArrowUpRight className="size-4" />
            </span>
          </div>
        </Link>
      </HoverLift>
    </Reveal>
  );
}

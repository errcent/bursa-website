import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

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
            <span className="absolute right-4 top-4 rounded-full border border-accent/30 bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
              Unggulan
            </span>
          )}

          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-accent/25 bg-accent-soft text-accent transition-transform duration-300 group-hover:scale-105">
              <Icon className="size-5" />
            </span>
            <span className="badge-muted mt-0.5">{tool.tag}</span>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <h3
              className={cn(
                "font-heading font-semibold tracking-tight",
                compact ? "text-sm sm:text-base" : "text-base sm:text-lg"
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

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {tool.difficulty && (
                <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5">
                  {difficultyLabel[tool.difficulty]}
                </span>
              )}
              {tool.timeEstimate && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  {tool.timeEstimate}
                </span>
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-transform group-hover:translate-x-0.5">
              Buka
              <ArrowRight className="size-3.5" />
            </span>
          </div>
        </Link>
      </HoverLift>
    </Reveal>
  );
}

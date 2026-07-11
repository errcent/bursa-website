import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HoverLift, Reveal } from "@/components/motion/reveal";
import type { LabTool } from "@/lib/lab/tools";

export function LabToolCard({ tool }: { tool: LabTool }) {
  const Icon = tool.icon;

  return (
    <Reveal>
      <HoverLift>
        <Link
          href={tool.href}
          className="surface-card-hover group flex h-full flex-col gap-4 p-5 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-accent/25 bg-accent-soft text-accent">
              <Icon className="size-5" />
            </span>
            <span className="badge-muted">{tool.tag}</span>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <h3 className="font-heading text-base font-semibold tracking-tight sm:text-lg">
              {tool.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
          </div>

          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-transform group-hover:translate-x-0.5">
            Buka tool
            <ArrowRight className="size-3.5" />
          </span>
        </Link>
      </HoverLift>
    </Reveal>
  );
}

"use client";

import Link from "next/link";
import { BookOpen, Share2 } from "lucide-react";

import { cn } from "@/lib/utils";

type LessonQuickActionsProps = {
  onShare: () => void;
  shareFeedback: string | null;
  guidebookHref?: string;
  guidebookExternal?: boolean;
  className?: string;
};

const iconBtn =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground";

export function LessonQuickActions({
  onShare,
  shareFeedback,
  guidebookHref,
  guidebookExternal = false,
  className,
}: LessonQuickActionsProps) {
  return (
    <div className={cn("flex shrink-0 items-center gap-0.5", className)}>
      <button
        type="button"
        onClick={onShare}
        className={iconBtn}
        title={shareFeedback ?? "Bagikan"}
        aria-label={shareFeedback ?? "Bagikan tautan pelajaran"}
      >
        <Share2 className="size-4" aria-hidden />
      </button>
      {guidebookHref ? (
        <Link
          href={guidebookHref}
          {...(guidebookExternal ? { target: "_blank", rel: "noopener noreferrer" } : undefined)}
          className={iconBtn}
          title="Materi pelajaran"
          aria-label="Buka materi pelajaran"
        >
          <BookOpen className="size-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { BookOpen, Bookmark, Share2 } from "lucide-react";

import { BookmarkToggleButton } from "@/components/bookmark-toggle-button";
import { useBookmark } from "@/hooks/use-bookmarks";
import { cn } from "@/lib/utils";

type LessonQuickActionsProps = {
  onShare: () => void;
  shareFeedback: string | null;
  guidebookHref: string;
  guidebookExternal: boolean;
  courseSlug: string;
};

export function LessonQuickActions({
  onShare,
  shareFeedback,
  guidebookHref,
  guidebookExternal,
  courseSlug,
}: LessonQuickActionsProps) {
  const courseBookmarkRef = { type: "course" as const, slug: courseSlug };
  const { saved: courseSaved, toggle: toggleCourseSave } = useBookmark(courseBookmarkRef);

  return (
    <>
      <div className="mt-3 grid grid-cols-3 gap-2 md:hidden">
        <button
          type="button"
          onClick={onShare}
          className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border border-border/80 bg-card px-2 py-2 text-[11px] font-medium text-foreground transition-colors hover:bg-muted/40"
        >
          <Share2 className="size-4 shrink-0" aria-hidden />
          {shareFeedback ?? "Share"}
        </button>
        <Link
          href={guidebookHref}
          {...(guidebookExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : undefined)}
          className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border border-border/80 bg-card px-2 py-2 text-[11px] font-medium text-foreground transition-colors hover:bg-muted/40"
        >
          <BookOpen className="size-4 shrink-0" aria-hidden />
          Guidebook
        </Link>
        <button
          type="button"
          aria-pressed={courseSaved}
          onClick={() => toggleCourseSave()}
          className={cn(
            "flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[11px] font-medium transition-colors",
            courseSaved
              ? "border-accent/35 bg-accent/10 text-accent"
              : "border-border/80 bg-card text-foreground hover:bg-muted/40"
          )}
        >
          <Bookmark
            className={cn("size-4 shrink-0", courseSaved && "fill-current")}
            aria-hidden
          />
          {courseSaved ? "Tersimpan" : "Save"}
        </button>
      </div>

      <div className="mt-2 hidden flex-wrap gap-2 md:flex">
        <button
          type="button"
          onClick={onShare}
          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
        >
          <Share2 className="size-4 shrink-0" aria-hidden />
          {shareFeedback ?? "Share"}
        </button>
        <Link
          href={guidebookHref}
          {...(guidebookExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : undefined)}
          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
        >
          <BookOpen className="size-4 shrink-0" aria-hidden />
          Guidebook
        </Link>
        <div
          className={cn(
            "inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
            courseSaved
              ? "border-accent/35 bg-accent/10 text-accent"
              : "border-border/80 bg-card text-foreground"
          )}
        >
          <BookmarkToggleButton
            bookmarkRef={courseBookmarkRef}
            className="size-7 shrink-0 opacity-100"
          />
          <span>{courseSaved ? "Tersimpan" : "Save"}</span>
        </div>
      </div>
    </>
  );
}

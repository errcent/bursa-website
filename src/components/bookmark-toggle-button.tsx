"use client";

import { Bookmark } from "lucide-react";

import { useBookmark } from "@/hooks/use-bookmarks";
import { useMobileLayout } from "@/hooks/use-mobile-layout";
import type { BookmarkRef } from "@/lib/bookmarks/types";
import { cn } from "@/lib/utils";

const LABELS: Record<BookmarkRef["type"], { save: string; remove: string }> = {
  course: { save: "Simpan kelas", remove: "Hapus kelas tersimpan" },
  lesson: { save: "Simpan", remove: "Hapus simpanan" },
  playlist: { save: "Simpan playlist", remove: "Hapus playlist tersimpan" },
  mentor: { save: "Simpan mentor", remove: "Hapus mentor tersimpan" },
};

export function BookmarkToggleButton({
  bookmarkRef,
  className,
}: {
  bookmarkRef: BookmarkRef;
  className?: string;
}) {
  const { saved, toggle } = useBookmark(bookmarkRef);
  const isMobile = useMobileLayout();
  const labels = LABELS[bookmarkRef.type];
  const ariaLabel = saved ? labels.remove : labels.save;

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        toggle();
      }}
      className={cn(
        "pointer-events-auto inline-flex size-8 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        saved
          ? "border-accent/45 bg-accent/25 text-accent opacity-100 shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_18%,transparent)]"
          : "border-white/15 bg-black/45 text-white/70 hover:border-white/25 hover:bg-black/55 hover:text-white",
        isMobile
          ? "opacity-100"
          : saved
            ? "opacity-90 group-hover:opacity-100"
            : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
        className
      )}
    >
      <Bookmark
        className={cn("size-4 transition-transform duration-200", saved && "fill-current")}
        strokeWidth={saved ? 2 : 1.75}
        aria-hidden
      />
    </button>
  );
}

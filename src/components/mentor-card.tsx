"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";

import { BookmarkToggleButton } from "@/components/bookmark-toggle-button";
import { MentorPhoto } from "@/components/mentor-photo";
import type { Mentor } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MentorCard({
  mentor,
  className,
  variant = "default",
  hideBookmark = false,
}: {
  mentor: Mentor;
  className?: string;
  /** "compact" — smaller overlay tile; "discover" — landing carousel; "catalog" — name below photo. */
  variant?: "default" | "compact" | "discover" | "catalog";
  /** Hide bookmark toggle (e.g. landing page). */
  hideBookmark?: boolean;
}) {
  const isCompact = variant === "compact";
  const isDiscover = variant === "discover";
  const isCatalog = variant === "catalog";

  return (
    <Link
      href={`/instruktur/${mentor.slug}`}
      prefetch={false}
      className={cn(
        "@container group relative block w-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isCatalog ? "overflow-visible" : "overflow-hidden rounded-2xl",
        className
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl",
          isDiscover ? "aspect-[16/10] rounded-2xl" : "aspect-[3/4]"
        )}
      >
        <MentorPhoto mentor={mentor} className="absolute inset-0" />

        {!isCatalog ? (
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
          />
        ) : null}

        {mentor.verified && (
          <span
            className={cn(
              "absolute inline-flex items-center justify-center rounded-full bg-accent/20 text-accent backdrop-blur-sm",
              isCompact ? "right-1.5 top-1.5 size-4" : "right-2 top-2 size-5"
            )}
            title="Mentor terverifikasi"
          >
            <BadgeCheck className={isCompact ? "size-2.5" : "size-3"} />
          </span>
        )}

        {!hideBookmark ? (
          <div
            className={cn(
              "absolute z-20",
              isCompact || isCatalog ? "bottom-1.5 left-1.5" : "bottom-2.5 left-2.5"
            )}
          >
            <BookmarkToggleButton
              bookmarkRef={{ type: "mentor", slug: mentor.slug }}
              className={isCompact || isCatalog ? "size-7 [&_svg]:size-3.5" : undefined}
            />
          </div>
        ) : null}

        {!isCatalog ? (
          <div className={cn("absolute inset-x-0 bottom-0", isCompact ? "p-2" : "p-3")}>
            <h3
              className={cn(
                "line-clamp-1 font-heading font-semibold text-white",
                isCompact ? "text-[11px]" : "text-sm @[180px]:text-base"
              )}
            >
              {mentor.name}
            </h3>
            <p
              className={cn(
                "line-clamp-2 font-light text-white/75",
                isCompact ? "mt-0.5 text-[9px]" : "mt-1 text-[11px] @[180px]:text-xs"
              )}
            >
              {mentor.title}
            </p>
          </div>
        ) : null}
      </div>

      {isCatalog ? (
        <div className="pt-2">
          <h3 className="line-clamp-1 font-heading text-[11px] font-semibold text-foreground @[180px]:text-sm">
            {mentor.name}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-[9px] font-light text-muted-foreground @[180px]:text-[11px]">
            {mentor.title}
          </p>
        </div>
      ) : null}
    </Link>
  );
}

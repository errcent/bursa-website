"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";

import { MentorPhoto } from "@/components/mentor-photo";
import type { Mentor } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MentorCard({
  mentor,
  className,
  variant = "default",
}: {
  mentor: Mentor;
  className?: string;
  /** Compact tile for mobile horizontal mentor rows. */
  variant?: "default" | "compact";
}) {
  const isCompact = variant === "compact";

  return (
    <Link
      href={`/instruktur/${mentor.slug}`}
      className={cn(
        "@container group relative block w-full overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl">
        <MentorPhoto mentor={mentor} className="absolute inset-0" />

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
        />

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

        <div className={cn("absolute inset-x-0 bottom-0", isCompact ? "p-1.5" : "p-2.5")}>
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
              "line-clamp-1 font-light text-white/70",
              isCompact ? "mt-0.5 text-[9px]" : "mt-0.5 text-[11px]"
            )}
          >
            {mentor.title}
          </p>
        </div>
      </div>
    </Link>
  );
}

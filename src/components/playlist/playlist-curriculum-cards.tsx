"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { BookmarkToggleButton } from "@/components/bookmark-toggle-button";
import {
  AccessBadge,
  formatDurationBadge,
  isItemPlayable,
  itemHref,
} from "@/components/playlist/playlist-item-utils";
import { LessonPreviewThumb } from "@/components/video/lesson-preview-thumb";
import type { PlaylistDetail } from "@/lib/playlist/types";
import { cn } from "@/lib/utils";

type PlaylistCurriculumCardsProps = {
  playlist: PlaylistDetail;
  className?: string;
  hideBookmark?: boolean;
};

export function PlaylistCurriculumCards({
  playlist,
  className,
  hideBookmark = false,
}: PlaylistCurriculumCardsProps) {
  const { session } = useAuth();

  if (playlist.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-border/60 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">Playlist ini masih kosong.</p>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto flex w-full max-w-4xl flex-col", className)}>
      <div className="mx-auto flex w-full max-w-3xl flex-col divide-y divide-border/35">
        {playlist.items.map((item) => {
          const status = item.accessStatus;
          const playable = isItemPlayable(status);
          const href = itemHref(item, status, Boolean(session));
          const isFree = status === "free";
          const hasAccess = status === "owned";
          const durationMinutes = item.durationMinutes ?? 0;

          return (
            <div
              key={item.id}
              className="group mx-auto grid w-full min-w-0 grid-cols-[minmax(0,7.25rem)_1fr] items-start gap-3 py-3 sm:grid-cols-[minmax(0,260px)_1fr] sm:gap-8 sm:py-4 lg:grid-cols-[minmax(0,300px)_1fr]"
            >
              <div className="relative min-w-0">
                <Link href={href} className="block min-w-0">
                  <LessonPreviewThumb
                    title={item.lessonTitle ?? item.courseTitle ?? "Video"}
                    isFree={isFree}
                    hasAccess={hasAccess}
                    durationMinutes={durationMinutes}
                    durationLabel={formatDurationBadge(item.durationMinutes)}
                    size="lg"
                    showPlayOverlay={playable}
                    durationPosition="bottom-right"
                    className="rounded-md border-border"
                  />
                </Link>
                {!hideBookmark && item.courseSlug && item.lessonLegacyId ? (
                  <div className="absolute bottom-2.5 left-2.5 z-20">
                    <BookmarkToggleButton
                      bookmarkRef={{
                        type: "lesson",
                        courseSlug: item.courseSlug,
                        lessonId: item.lessonLegacyId,
                      }}
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-col justify-center gap-1.5">
                <Link href={href} className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="break-words font-heading text-sm font-medium leading-snug text-foreground sm:text-lg lg:text-xl">
                      {item.lessonTitle ?? item.courseTitle ?? "Video"}
                    </h4>
                    <AccessBadge status={status} />
                  </div>
                </Link>

                {item.courseTitle ? (
                  <Link href={href}>
                    <p className="section-copy line-clamp-2 max-w-2xl break-words text-xs leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                      dari {item.courseTitle}
                    </p>
                  </Link>
                ) : null}

                {item.mentorName ? (
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
                    <UserRound className="size-3.5 shrink-0" />
                    {item.mentorName}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

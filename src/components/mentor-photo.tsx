import { getMentorTheme } from "@/lib/mentors/theme";
import { cn } from "@/lib/utils";

export type MentorPhotoSubject = {
  slug: string;
  name: string;
  initials: string;
  cutoutUrl?: string;
};

/**
 * Stands in for a real mentor headshot: a distinct per-mentor gradient backdrop
 * (see lib/mentors/theme) with the mentor's cutout artwork bottom-aligned on top.
 * Used by both course thumbnails (mentor-as-course-art) and mentor cards.
 */
export function MentorPhoto({
  mentor,
  className,
  imageClassName,
}: {
  mentor: MentorPhotoSubject;
  className?: string;
  imageClassName?: string;
}) {
  const theme = getMentorTheme(mentor.slug);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ background: theme.gradient }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(circle at 50% 8%, ${theme.glow}55, transparent 62%)`,
        }}
      />
      {mentor.cutoutUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mentor.cutoutUrl}
          alt=""
          aria-hidden
          className={cn(
            "absolute inset-x-0 bottom-0 h-[92%] w-full object-contain object-bottom transition-transform duration-500 ease-out group-hover:scale-[1.04]",
            imageClassName
          )}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center font-heading text-2xl font-semibold text-white/80"
          aria-hidden
        >
          {mentor.initials}
        </span>
      )}
    </div>
  );
}

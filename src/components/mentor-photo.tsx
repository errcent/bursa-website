import { getMentorTheme } from "@/lib/mentors/theme";
import { cn } from "@/lib/utils";

export type MentorPhotoSubject = {
  slug: string;
  name: string;
  initials: string;
  cutoutUrl?: string;
};

/**
 * Per-mentor gradient backdrop with initials. Cutout photos are disabled until
 * MENTOR_PHOTOS_ENABLED is turned on in lib/thumbnails/constants.
 */
export function MentorPhoto({
  mentor,
  className,
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
      <span
        className="absolute inset-0 flex items-center justify-center font-heading text-2xl font-semibold text-white/80"
        aria-hidden
      >
        {mentor.initials}
      </span>
    </div>
  );
}

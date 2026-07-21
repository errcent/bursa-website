import type { Mentor } from "@/lib/types";

/** Prefer lightweight SVG cutout over heavy PNG headshots in UI. */
export function resolveMentorAvatarUrl(
  mentor: Pick<Mentor, "cutoutUrl" | "avatarUrl">
): string | undefined {
  return mentor.cutoutUrl?.trim() || mentor.avatarUrl?.trim() || undefined;
}

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { VerifiedBadge } from "@/components/verified-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveMentorAvatarUrl } from "@/lib/mentors/avatar";
import type { Mentor } from "@/lib/types";

interface CourseInstructorSectionProps {
  mentor: Mentor;
}

export function CourseInstructorSection({ mentor }: CourseInstructorSectionProps) {
  const shortBio = mentor.title || mentor.bio;
  const avatarSrc = resolveMentorAvatarUrl(mentor);

  return (
    <section>
      <h2 className="section-title mb-5">Instruktur</h2>
      <Link
        href={`/instruktur/${mentor.slug}`}
        className="group flex min-w-0 items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-border/90 sm:items-center sm:gap-6 sm:p-6"
      >
        <Avatar className="size-16 shrink-0 border border-border/80 sm:size-[4.5rem]">
          {avatarSrc ? (
            <AvatarImage
              src={avatarSrc}
              alt={`Foto ${mentor.name}`}
              className="object-cover object-top"
            />
          ) : null}
          <AvatarFallback className="bg-surface-2 font-heading text-lg font-medium">
            {mentor.initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-accent sm:text-xl">
              {mentor.name}
            </p>
            <VerifiedBadge verified={mentor.verified} />
          </div>
          <p className="mt-1.5 line-clamp-2 break-words text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
            {shortBio}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
            Lihat profil lengkap
            <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </section>
  );
}

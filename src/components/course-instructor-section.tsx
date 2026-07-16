import Link from "next/link";

import { VerifiedBadge } from "@/components/verified-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Mentor } from "@/lib/types";

interface CourseInstructorSectionProps {
  mentor: Mentor;
}

export function CourseInstructorSection({ mentor }: CourseInstructorSectionProps) {
  const shortBio = mentor.title || mentor.bio;

  return (
    <section className="border-b border-border/60 pb-10 sm:pb-12">
      <h2 className="mb-6 font-heading text-xl font-medium sm:text-2xl">Instruktur</h2>
      <Link
        href={`/instruktur/${mentor.slug}`}
        className="group flex min-w-0 items-start gap-4 rounded-xl transition-colors hover:bg-surface/50 sm:items-center sm:gap-6 sm:p-4 sm:-mx-4"
      >
        <Avatar className="size-16 shrink-0 border border-border/80 sm:size-20">
          {mentor.avatarUrl ? (
            <AvatarImage
              src={mentor.avatarUrl}
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
          <p className="mt-1 break-words font-sans text-sm leading-relaxed text-muted-foreground sm:text-base">
            {shortBio}
          </p>
        </div>
      </Link>
    </section>
  );
}

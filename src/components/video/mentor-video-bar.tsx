"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Mentor } from "@/lib/types";
import { cn } from "@/lib/utils";

export type MentorVideoBarMentor = Pick<
  Mentor,
  "slug" | "name" | "initials" | "avatarUrl"
> &
  Partial<Pick<Mentor, "title">>;

interface MentorVideoBarProps {
  mentor: MentorVideoBarMentor;
  className?: string;
}

export function MentorVideoBar({ mentor, className }: MentorVideoBarProps) {
  return (
    <Link
      href={`/instruktur/${mentor.slug}`}
      className={cn(
        "group flex min-h-11 items-center gap-3 rounded-xl border border-border/80 bg-surface px-3 py-2.5 transition-colors",
        "hover:border-accent/35 hover:bg-surface-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        className
      )}
      aria-label={`Lihat profil instruktur ${mentor.name}`}
    >
      <Avatar
        size="sm"
        className="size-9 shrink-0 border border-border/80 bg-surface-2 shadow-[0_0_10px_var(--glow)] sm:size-10"
      >
        {mentor.avatarUrl ? (
          <AvatarImage
            src={mentor.avatarUrl}
            alt={`Foto ${mentor.name}`}
            className="object-cover object-top"
          />
        ) : null}
        <AvatarFallback className="bg-surface-2 text-xs font-medium text-foreground">
          {mentor.initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-accent/90">
          Instruktur
        </p>
        <p className="truncate text-sm font-medium leading-tight text-foreground">
          {mentor.name}
        </p>
        {mentor.title ? (
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {mentor.title}
          </p>
        ) : null}
      </div>

      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
        aria-hidden
      />
    </Link>
  );
}

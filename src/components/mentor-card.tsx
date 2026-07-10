"use client";

import Link from "next/link";
import { Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/star-rating";
import type { Mentor } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MentorCard({ mentor, className }: { mentor: Mentor; className?: string }) {
  return (
    <Link
      href={`/instruktur/${mentor.slug}`}
      className={cn(
        "surface-card-hover group flex h-full w-full flex-col items-center gap-4 p-5 text-center",
        className
      )}
    >
      <div className="relative flex items-center justify-center pt-1">
        <div
          aria-hidden
          className="absolute inset-0 scale-110 rounded-full bg-[radial-gradient(circle,var(--glow)_0%,transparent_70%)] opacity-70 transition-opacity duration-300 group-hover:opacity-100"
        />
        <Avatar className="relative size-24 border border-border bg-surface-2 shadow-[0_0_20px_var(--glow)] transition-all duration-300 ease-out group-hover:scale-105 group-hover:border-accent/30 group-hover:shadow-[0_0_28px_var(--glow-strong)] sm:size-28">
          {mentor.avatarUrl ? (
            <AvatarImage
              src={mentor.avatarUrl}
              alt={`Foto ${mentor.name}`}
              className="object-cover object-top"
            />
          ) : null}
          <AvatarFallback className="bg-surface-2 font-heading text-lg font-medium sm:text-xl">
            {mentor.initials}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col items-center gap-1">
        <h3 className="font-heading text-sm font-medium">{mentor.name}</h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">{mentor.title}</p>
      </div>
      <p className="text-xs text-muted-foreground">{mentor.instruments.join(" · ")}</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <StarRating rating={mentor.rating} />
        <span className="flex items-center gap-1">
          <Users className="size-3.5" />
          {mentor.studentsCount.toLocaleString("id-ID")}
        </span>
      </div>
    </Link>
  );
}

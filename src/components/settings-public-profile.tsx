"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SettingsPublicProfile() {
  const { messages } = useLanguage();
  const t = messages.settings.publicProfile;

  return (
    <div className="surface-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">{t.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
      </div>
      <Link
        href="/profil"
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11 shrink-0")}
      >
        <UserRound className="size-3.5" />
        {t.editButton}
      </Link>
    </div>
  );
}

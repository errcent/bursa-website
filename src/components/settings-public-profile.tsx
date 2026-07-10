"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";

export function SettingsPublicProfile() {
  const { messages } = useLanguage();
  const t = messages.settings.publicProfile;

  return (
    <div className="surface-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">{t.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
      </div>
      <Button size="lg" variant="outline" className="min-h-11 shrink-0" render={<Link href="/profil" />}>
        <UserRound className="size-3.5" />
        {t.editButton}
      </Button>
    </div>
  );
}

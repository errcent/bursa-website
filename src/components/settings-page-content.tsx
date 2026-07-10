"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { SettingsHero } from "@/components/settings-hero";
import { SettingsPublicProfile } from "@/components/settings-public-profile";
import { SettingsShell } from "@/components/settings-shell";
import { Separator } from "@/components/ui/separator";

export function SettingsPageContent() {
  const { messages } = useLanguage();

  return (
    <>
      <SettingsHero />
      <div className="container-page section-spacious">
        <Link
          href="/dashboard"
          className="link-muted mb-6 inline-flex min-h-11 items-center gap-1.5"
        >
          <ArrowLeft className="size-4" />
          {messages.common.back}
        </Link>

        <div className="max-w-2xl">
          <SettingsPublicProfile />

          <Separator className="my-10 opacity-60" />

          <SettingsShell />
        </div>
      </div>
    </>
  );
}

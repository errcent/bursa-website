"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { SettingsHero } from "@/components/settings-hero";
import { SettingsShell } from "@/components/settings-shell";

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
          <SettingsShell />
        </div>
      </div>
    </>
  );
}

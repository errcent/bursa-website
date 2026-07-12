"use client";

import { ThemeSelector } from "@/components/theme-selector";

export function SettingsAppearance({ compact }: { compact?: boolean }) {
  return <ThemeSelector compact={compact} />;
}

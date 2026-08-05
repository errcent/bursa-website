"use client";

import { useMemo } from "react";

import { DEFAULT_LOCALE } from "@/lib/i18n/locale";
import { getMessages, type Messages } from "@/lib/i18n/messages";

type LanguageContextValue = {
  locale: typeof DEFAULT_LOCALE;
  messages: Messages;
  mounted: boolean;
};

const value: LanguageContextValue = {
  locale: DEFAULT_LOCALE,
  messages: getMessages(DEFAULT_LOCALE),
  mounted: true,
};

/** Fixed Bahasa Indonesia — locale switching removed from product UI. */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useLanguage(): LanguageContextValue {
  return useMemo(() => value, []);
}

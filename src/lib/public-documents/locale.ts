import { headers } from "next/headers";

import { LOCALE_HEADER, parseLocaleHeader, type LegalLocale } from "@/lib/hosts/hosts";

export async function resolvePortalLocale(slugSegments?: string[]): Promise<{
  locale: LegalLocale;
  docSlug?: string;
}> {
  const headerStore = await headers();
  let locale = parseLocaleHeader(headerStore.get(LOCALE_HEADER));
  let parts = slugSegments ?? [];
  if (parts[0] === "en") {
    locale = "en";
    parts = parts.slice(1);
  }
  return { locale, docSlug: parts[0] };
}

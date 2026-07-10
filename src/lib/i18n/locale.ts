export type Locale = "id" | "en";

export const DEFAULT_LOCALE: Locale = "id";

export const LOCALE_STORAGE_KEY = "bursa-locale";

export const LOCALES: readonly Locale[] = ["id", "en"] as const;

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "id" || value === "en";
}

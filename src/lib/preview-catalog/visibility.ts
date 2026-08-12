import { isPaidCheckoutEnabled } from "@/lib/catalog/payment-gate";

export function isPreviewCatalogActive(): boolean {
  return !isPaidCheckoutEnabled();
}

/**
 * Layer 1 - dismissible banner on discovery surfaces only.
 * Home keeps a clean fold (no amber “warehouse” sticker above the hero).
 */
export function isPreviewBannerPath(pathname: string): boolean {
  if (pathname === "/katalog") return true;
  if (pathname === "/panduan-belajar" || pathname === "/panduan-belajar/quiz") return true;
  if (pathname === "/playlist" || pathname.startsWith("/playlist/")) return true;
  return false;
}

/** Layer 2, detail notice (no banner on these paths). */
export function isPreviewDetailPath(pathname: string): boolean {
  return pathname.startsWith("/kelas/") || pathname.startsWith("/instruktur/");
}

export function shouldShowPreviewBanner(pathname: string): boolean {
  if (!isPreviewCatalogActive()) return false;
  if (isPreviewDetailPath(pathname)) return false;
  return isPreviewBannerPath(pathname);
}

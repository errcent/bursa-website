import { isPaidCheckoutEnabled } from "@/lib/catalog/payment-gate";

export function isPreviewCatalogActive(): boolean {
  return !isPaidCheckoutEnabled();
}

/** Layer 1 — compact dismissible banner on list/discovery pages. */
export function isPreviewBannerPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/katalog") return true;
  if (pathname === "/panduan-belajar" || pathname === "/panduan-belajar/quiz") return true;
  if (pathname === "/playlist" || pathname.startsWith("/playlist/")) return true;
  return false;
}

/** Layer 2 — detail notice (no banner on these paths). */
export function isPreviewDetailPath(pathname: string): boolean {
  return pathname.startsWith("/kelas/") || pathname.startsWith("/instruktur/");
}

export function shouldShowPreviewBanner(pathname: string): boolean {
  if (!isPreviewCatalogActive()) return false;
  if (isPreviewDetailPath(pathname)) return false;
  return isPreviewBannerPath(pathname);
}

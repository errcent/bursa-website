/**
 * Multi-host map for bursanalar.com.
 * Edge-safe (no Node/Prisma). Never set cookie Domain=.bursanalar.com.
 */

export type LegalLocale = "id" | "en";
export type HostRole = "apex" | "admin" | "trust" | "privacy" | "other";

export const LOCALE_HEADER = "x-bursa-locale";

export const APEX_HOST = "bursanalar.com";
export const ADMIN_HOST = "admin.bursanalar.com";
export const TRUST_HOST = "trust.bursanalar.com";
export const PRIVACY_HOST = "privacy.bursanalar.com";

export const PRODUCTION_APP_HOSTS = new Set([
  APEX_HOST,
  ADMIN_HOST,
  TRUST_HOST,
  PRIVACY_HOST,
]);

export const GOVERNING_LANGUAGE_ID =
  "Jika versi Bahasa Indonesia dan Inggris berbeda, versi Bahasa Indonesia yang berlaku.";
export const GOVERNING_LANGUAGE_EN =
  "If the Indonesian and English versions conflict, the Indonesian version governs.";

export function normalizeHost(host: string | null | undefined): string {
  return (host ?? "").split(":")[0]?.toLowerCase() ?? "";
}

export function hostRole(host: string | null | undefined): HostRole {
  const h = normalizeHost(host);
  if (h === APEX_HOST) return "apex";
  if (h === ADMIN_HOST) return "admin";
  if (h === TRUST_HOST) return "trust";
  if (h === PRIVACY_HOST) return "privacy";
  return "other";
}

export function originFor(role: Exclude<HostRole, "other">): string {
  const hosts = {
    apex: APEX_HOST,
    admin: ADMIN_HOST,
    trust: TRUST_HOST,
    privacy: PRIVACY_HOST,
  } as const;
  return `https://${hosts[role]}`;
}

export function isProductionHostRouting(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/** Privacy: DB/vault slug → public path segment (empty = hub). */
export const PRIVACY_INTERNAL_TO_PUBLIC: Record<string, string> = {
  hub: "",
  kebijakan: "policies",
  cookie: "cookies",
  "sub-prosesor": "subprocessors",
  "permintaan-data": "requests",
  faq: "faq",
};

export const TRUST_INTERNAL_TO_PUBLIC: Record<string, string> = {
  hub: "",
  keamanan: "security",
  kontrol: "controls",
  kepatuhan: "compliance",
  pelaporan: "report",
  "sumber-daya": "resources",
  faq: "faq",
};

function invert(map: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [internal, pub] of Object.entries(map)) {
    out[pub] = internal;
  }
  return out;
}

export const PRIVACY_PUBLIC_TO_INTERNAL = invert(PRIVACY_INTERNAL_TO_PUBLIC);
export const TRUST_PUBLIC_TO_INTERNAL = invert(TRUST_INTERNAL_TO_PUBLIC);

export function withLocalePrefix(pathname: string, locale: LegalLocale): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === "id") return path === "" ? "/" : path;
  if (path === "/") return "/en";
  return `/en${path}`;
}

export function stripLocalePrefix(pathname: string): {
  locale: LegalLocale;
  pathname: string;
} {
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const rest = pathname.slice(3);
    return { locale: "en", pathname: rest ? rest : "/" };
  }
  return { locale: "id", pathname };
}

export function parseLocaleHeader(value: string | null | undefined): LegalLocale {
  return value === "en" ? "en" : "id";
}

function joinPublic(segment: string, locale: LegalLocale): string {
  const path = segment ? `/${segment}` : "/";
  return withLocalePrefix(path, locale);
}

export function privacyPublicPath(internalSlug: string, locale: LegalLocale = "id"): string {
  const segment = PRIVACY_INTERNAL_TO_PUBLIC[internalSlug];
  if (segment === undefined) return joinPublic(internalSlug, locale);
  return joinPublic(segment, locale);
}

export function trustPublicPath(internalSlug: string, locale: LegalLocale = "id"): string {
  const segment = TRUST_INTERNAL_TO_PUBLIC[internalSlug];
  if (segment === undefined) return joinPublic(internalSlug, locale);
  return joinPublic(segment, locale);
}

export function termsPublicPath(internalSlug: string, locale: LegalLocale = "id"): string {
  if (internalSlug === "hub" || internalSlug === "terms" || !internalSlug) {
    return withLocalePrefix("/terms", locale);
  }
  return withLocalePrefix(`/terms/${internalSlug}`, locale);
}

export function privacyPublicUrl(internalSlug: string, locale: LegalLocale = "id"): string {
  return `${originFor("privacy")}${privacyPublicPath(internalSlug, locale)}`;
}

export function trustPublicUrl(internalSlug: string, locale: LegalLocale = "id"): string {
  return `${originFor("trust")}${trustPublicPath(internalSlug, locale)}`;
}

export function termsPublicUrl(internalSlug: string, locale: LegalLocale = "id"): string {
  return `${originFor("apex")}${termsPublicPath(internalSlug, locale)}`;
}

export function adminPublicUrl(pathname = "/"): string {
  const path = pathname === "/admin" || pathname === "/admin/" ? "/" : pathname;
  return `${originFor("admin")}${path.startsWith("/") ? path : `/${path}`}`;
}

export const LEGAL_HREFS = {
  terms: termsPublicUrl("terms"),
  termsEn: termsPublicUrl("terms", "en"),
  guidelines: termsPublicUrl("learner-guidelines"),
  guidelinesEn: termsPublicUrl("learner-guidelines", "en"),
  privacy: privacyPublicUrl("hub"),
  privacyEn: privacyPublicUrl("hub", "en"),
  privacyPolicy: privacyPublicUrl("kebijakan"),
  cookies: privacyPublicUrl("cookie"),
  subprocessors: privacyPublicUrl("sub-prosesor"),
  dsar: privacyPublicUrl("permintaan-data"),
  trust: trustPublicUrl("hub"),
  trustEn: trustPublicUrl("hub", "en"),
} as const;

const LEGACY_HREF_REWRITES: [string, string][] = [
  ["/privasi/permintaan-data", LEGAL_HREFS.dsar],
  ["/privasi/sub-prosesor", LEGAL_HREFS.subprocessors],
  ["/privasi/kebijakan", LEGAL_HREFS.privacyPolicy],
  ["/privasi/cookie", LEGAL_HREFS.cookies],
  ["/kepercayaan/sumber-daya", trustPublicUrl("sumber-daya")],
  ["/kepercayaan/pelaporan", trustPublicUrl("pelaporan")],
  ["/kepercayaan/kepatuhan", trustPublicUrl("kepatuhan")],
  ["/kepercayaan/keamanan", trustPublicUrl("keamanan")],
  ["/kepercayaan/kontrol", trustPublicUrl("kontrol")],
  ["/kepercayaan/faq", trustPublicUrl("faq")],
  ["/privasi/faq", privacyPublicUrl("faq")],
  ["/syarat-dan-ketentuan", LEGAL_HREFS.terms],
  ["/kebijakan-privasi", LEGAL_HREFS.privacyPolicy],
  ["/kepercayaan", LEGAL_HREFS.trust],
  ["/privasi", LEGAL_HREFS.privacy],
];

/** Rewrite legacy apex legal paths in markdown / UI hrefs to canonical hosts. */
export function rewriteLegalHref(href: string | undefined | null): string | undefined {
  if (!href) return href ?? undefined;
  if (process.env.NEXT_PUBLIC_VERCEL_ENV !== "production") return href;
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) {
    return href;
  }
  const [path, hash] = href.split("#");
  const suffix = hash ? `#${hash}` : "";
  for (const [from, to] of LEGACY_HREF_REWRITES) {
    if (path === from || path.startsWith(`${from}/`)) {
      return `${to}${suffix}`;
    }
  }
  return href;
}

/** Keep `/en` in the rewritten App Router path so ISR does not collide ID vs EN. */
function withInternalEn(basePath: string, locale: LegalLocale): string {
  if (locale !== "en") return basePath;
  const parts = basePath.split("/").filter(Boolean);
  if (parts.length === 0) return "/en";
  const rest = parts.slice(1).join("/");
  return rest ? `/${parts[0]}/en/${rest}` : `/${parts[0]}/en`;
}

export function internalPrivacyPath(internalSlug: string, locale: LegalLocale = "id"): string {
  const base = internalSlug === "hub" || !internalSlug ? "/privasi" : `/privasi/${internalSlug}`;
  return withInternalEn(base, locale);
}

export function internalTrustPath(internalSlug: string, locale: LegalLocale = "id"): string {
  const base = internalSlug === "hub" || !internalSlug ? "/kepercayaan" : `/kepercayaan/${internalSlug}`;
  return withInternalEn(base, locale);
}

export function internalTermsPath(internalSlug: string, locale: LegalLocale = "id"): string {
  const rest =
    !internalSlug || internalSlug === "hub" || internalSlug === "terms" ? "" : `/${internalSlug}`;
  return withInternalEn(`/terms${rest}`, locale);
}

export function legalHrefsFor(locale: LegalLocale) {
  return {
    terms: termsPublicUrl("terms", locale),
    guidelines: termsPublicUrl("learner-guidelines", locale),
    privacy: privacyPublicUrl("hub", locale),
    privacyPolicy: privacyPublicUrl("kebijakan", locale),
    cookies: privacyPublicUrl("cookie", locale),
    trust: trustPublicUrl("hub", locale),
  };
}

/** Public `/en` prefix or internal portal paths (`/privasi/en`, `/terms/en`). */
export function localeFromPathname(pathname: string): LegalLocale {
  if (stripLocalePrefix(pathname).locale === "en") return "en";
  if (/(^|\/)en(\/|$)/.test(pathname)) return "en";
  return "id";
}

export function mapPrivacyPublicToInternal(publicPath: string): string | null {
  const segment = publicPath === "/" ? "" : publicPath.replace(/^\//, "");
  if (!(segment in PRIVACY_PUBLIC_TO_INTERNAL)) return null;
  return PRIVACY_PUBLIC_TO_INTERNAL[segment];
}

export function mapTrustPublicToInternal(publicPath: string): string | null {
  const segment = publicPath === "/" ? "" : publicPath.replace(/^\//, "");
  if (!(segment in TRUST_PUBLIC_TO_INTERNAL)) return null;
  return TRUST_PUBLIC_TO_INTERNAL[segment];
}

/** Apex /privasi/... → canonical privacy host path (including /en). */
export function apexPrivacyRedirectTarget(pathname: string): string | null {
  const { locale, pathname: path } = stripLocalePrefix(pathname);
  if (path !== "/privasi" && !path.startsWith("/privasi/")) return null;
  const rest = path === "/privasi" ? "hub" : path.slice("/privasi/".length);
  if (rest === "en" || rest.startsWith("en/")) {
    const nested = rest === "en" ? "hub" : rest.slice(3);
    const slug = nested || "hub";
    if (!(slug in PRIVACY_INTERNAL_TO_PUBLIC) && slug !== "hub") return null;
    return privacyPublicUrl(slug === "hub" ? "hub" : slug, "en");
  }
  if (!(rest in PRIVACY_INTERNAL_TO_PUBLIC) && rest !== "hub") return null;
  return privacyPublicUrl(rest, locale);
}

export function apexTrustRedirectTarget(pathname: string): string | null {
  const { locale, pathname: path } = stripLocalePrefix(pathname);
  if (path !== "/kepercayaan" && !path.startsWith("/kepercayaan/")) return null;
  const rest = path === "/kepercayaan" ? "hub" : path.slice("/kepercayaan/".length);
  if (rest === "en" || rest.startsWith("en/")) {
    const nested = rest === "en" ? "hub" : rest.slice(3);
    const slug = nested || "hub";
    if (!(slug in TRUST_INTERNAL_TO_PUBLIC) && slug !== "hub") return null;
    return trustPublicUrl(slug === "hub" ? "hub" : slug, "en");
  }
  if (!(rest in TRUST_INTERNAL_TO_PUBLIC) && rest !== "hub") return null;
  return trustPublicUrl(rest, locale);
}

const ADMIN_PREFIXES = [
  "/admin",
  "/masuk",
  "/lupa-password",
  "/reset-password",
  "/auth",
  "/api/admin",
  "/api/auth",
];

export function isAdminHostAllowedPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isAdminAuthedPath(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/admin");
}

const PRIVACY_API = ["/api/privacy"];

export function isPrivacyHostAllowedPath(pathname: string): boolean {
  const { pathname: path } = stripLocalePrefix(pathname);
  if (PRIVACY_API.some((p) => path === p || path.startsWith(`${p}/`))) return true;
  if (path === "/privasi" || path.startsWith("/privasi/")) return true;
  return mapPrivacyPublicToInternal(path) !== null;
}

export function isTrustHostAllowedPath(pathname: string): boolean {
  const { pathname: path } = stripLocalePrefix(pathname);
  if (path === "/kepercayaan" || path.startsWith("/kepercayaan/")) return true;
  return mapTrustPublicToInternal(path) !== null;
}

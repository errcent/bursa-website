import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { checkApiRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import { verifyWebSessionTokenEdge } from "@/lib/auth/web-session-edge";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session.constants";
import {
  isKomunitasApiPath,
  KOMUNITAS_ENABLED,
} from "@/lib/features/komunitas";
import {
  APEX_HOST,
  ADMIN_HOST,
  LOCALE_HEADER,
  PRODUCTION_APP_HOSTS,
  apexNoteRedirectTarget,
  apexPrivacyRedirectTarget,
  apexTrustRedirectTarget,
  hostRole,
  internalPrivacyPath,
  internalTermsPath,
  internalTrustPath,
  isAdminAuthedPath,
  isAdminHostAllowedPath,
  isNoteHostAllowedPath,
  isPrivacyHostAllowedPath,
  isProductionHostRouting,
  isTrustHostAllowedPath,
  mapPrivacyPublicToInternal,
  mapTrustPublicToInternal,
  normalizeHost,
  originFor,
  privacyPublicPath,
  stripLocalePrefix,
  termsPublicPath,
  type LegalLocale,
} from "@/lib/hosts/hosts";

const MOBILE_DEV_ORIGINS = new Set([
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:19006",
  "http://127.0.0.1:19006",
]);

function needsRequestGuard(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/developer") ||
    pathname.startsWith("/mentor") ||
    pathname === "/komunitas" ||
    pathname.startsWith("/komunitas/")
  );
}

function applyMobileCors(response: NextResponse, origin: string | null): NextResponse {
  if (origin && MOBILE_DEV_ORIGINS.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Device-Id, X-Platform"
    );
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  }
  return response;
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(WEB_SESSION_COOKIE)?.value;
  if (!token) return false;
  const session = await verifyWebSessionTokenEdge(token);
  return Boolean(session);
}

function hostRedirect(hostname: string, pathname: string, search: string): NextResponse {
  return NextResponse.redirect(new URL(`https://${hostname}${pathname}${search}`), 308);
}

function rewriteWithLocale(
  request: NextRequest,
  pathname: string,
  locale: LegalLocale
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  return NextResponse.rewrite(url, { request: { headers } });
}

function canonicalUnknownHost(request: NextRequest): NextResponse | null {
  if (!isProductionHostRouting()) return null;
  const host = normalizeHost(request.headers.get("host"));
  if (!host || PRODUCTION_APP_HOSTS.has(host)) return null;
  return hostRedirect(APEX_HOST, request.nextUrl.pathname, request.nextUrl.search);
}

function apexEnglishTermsRewrite(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (pathname === "/en/terms") {
    return rewriteWithLocale(request, internalTermsPath("terms", "en"), "en");
  }
  if (pathname.startsWith("/en/terms/")) {
    const rest = pathname.slice("/en/terms/".length);
    return rewriteWithLocale(request, internalTermsPath(rest || "terms", "en"), "en");
  }
  return null;
}

function productionHostRouter(request: NextRequest): NextResponse | null {
  if (!isProductionHostRouting()) return null;

  const host = normalizeHost(request.headers.get("host"));
  const role = hostRole(host);
  const { pathname, search } = request.nextUrl;
  const { locale, pathname: pathWithoutLocale } = stripLocalePrefix(pathname);

  if (role === "apex") {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      const destPath = pathname === "/admin" || pathname === "/admin/" ? "/" : pathname;
      return hostRedirect(ADMIN_HOST, destPath, search);
    }
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (pathname === "/syarat-dan-ketentuan" || pathname.startsWith("/syarat-dan-ketentuan/")) {
      return hostRedirect(APEX_HOST, termsPublicPath("terms", "id"), search);
    }
    if (pathname === "/kebijakan-privasi") {
      return NextResponse.redirect(
        `${originFor("privacy")}${privacyPublicPath("kebijakan")}${search}`,
        308
      );
    }
    const privacyTarget = apexPrivacyRedirectTarget(pathname);
    if (privacyTarget) {
      return NextResponse.redirect(`${privacyTarget}${search}`, 308);
    }
    const trustTarget = apexTrustRedirectTarget(pathname);
    if (trustTarget) {
      return NextResponse.redirect(`${trustTarget}${search}`, 308);
    }
    const noteTarget = apexNoteRedirectTarget(pathname);
    if (noteTarget) {
      return NextResponse.redirect(`${noteTarget}${search}`, 308);
    }
    if (pathname.startsWith("/api/note") && pathname !== "/api/note/sso/start") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return null;
  }

  if (role === "admin") {
    if (!isAdminHostAllowedPath(pathname)) {
      return hostRedirect(APEX_HOST, pathname, search);
    }
    if (pathname === "/") {
      return rewriteWithLocale(request, "/admin", "id");
    }
    return null;
  }

  if (role === "privacy") {
    if (pathname === "/privasi" || pathname.startsWith("/privasi/")) {
      const target = apexPrivacyRedirectTarget(pathname);
      if (target) {
        return NextResponse.redirect(new URL(`${new URL(target).pathname}${search}`, request.url), 308);
      }
    }
    if (!isPrivacyHostAllowedPath(pathname)) {
      return hostRedirect(APEX_HOST, pathname, search);
    }
    const internalSlug = mapPrivacyPublicToInternal(pathWithoutLocale);
    if (internalSlug) {
      return rewriteWithLocale(request, internalPrivacyPath(internalSlug, locale), locale);
    }
    return null;
  }

  if (role === "trust") {
    if (pathname === "/kepercayaan" || pathname.startsWith("/kepercayaan/")) {
      const target = apexTrustRedirectTarget(pathname);
      if (target) {
        return NextResponse.redirect(new URL(`${new URL(target).pathname}${search}`, request.url), 308);
      }
    }
    if (!isTrustHostAllowedPath(pathname)) {
      return hostRedirect(APEX_HOST, pathname, search);
    }
    const internalSlug = mapTrustPublicToInternal(pathWithoutLocale);
    if (internalSlug) {
      return rewriteWithLocale(request, internalTrustPath(internalSlug, locale), locale);
    }
    return null;
  }

  if (role === "note") {
    if (pathname === "/api/note/sso/start") {
      const dest = new URL(`https://${APEX_HOST}/api/note/sso/start`);
      request.nextUrl.searchParams.forEach((value, key) => {
        dest.searchParams.set(key, value);
      });
      return NextResponse.redirect(dest, 302);
    }
    if (!isNoteHostAllowedPath(pathname)) {
      return hostRedirect(APEX_HOST, pathname, search);
    }
    if (pathname === "/") {
      return rewriteWithLocale(request, "/note", "id");
    }
    return null;
  }

  return null;
}

function needsLoginRedirect(pathname: string, role: ReturnType<typeof hostRole>): boolean {
  if (pathname.startsWith("/admin") || pathname.startsWith("/developer") || pathname.startsWith("/mentor")) {
    return true;
  }
  return role === "admin" && isAdminAuthedPath(pathname);
}

export async function proxy(request: NextRequest) {
  const unknownHost = canonicalUnknownHost(request);
  if (unknownHost) return unknownHost;

  const hostRouted = productionHostRouter(request);
  if (hostRouted) return hostRouted;

  const enTerms = apexEnglishTermsRewrite(request);
  if (enTerms) return enTerms;

  const { pathname } = request.nextUrl;
  const host = normalizeHost(request.headers.get("host"));
  const role = hostRole(host);
  const origin = request.headers.get("origin");
  const isApi = pathname.startsWith("/api/");

  if (isApi && request.method === "OPTIONS") {
    return applyMobileCors(new NextResponse(null, { status: 204 }), origin);
  }

  if (!needsRequestGuard(pathname) && !(role === "admin" && isAdminAuthedPath(pathname))) {
    return NextResponse.next();
  }

  if (isApi) {
    const rate = await checkApiRateLimit(request);
    if (!rate.allowed) {
      return applyMobileCors(rateLimitResponse(rate.retryAfterSec), origin);
    }
  }

  const sessionOk = await hasValidSession(request);

  if (pathname.startsWith("/api/admin") && !sessionOk) {
    return applyMobileCors(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      origin
    );
  }

  if (needsLoginRedirect(pathname, role) && !sessionOk) {
    const login = new URL("/masuk", request.url);
    login.searchParams.set("next", role === "admin" && pathname === "/" ? "/admin" : pathname);
    return NextResponse.redirect(login);
  }

  if (KOMUNITAS_ENABLED) {
    return isApi ? applyMobileCors(NextResponse.next(), origin) : NextResponse.next();
  }

  if (isKomunitasApiPath(pathname)) {
    return applyMobileCors(
      NextResponse.json({ error: "Komunitas feature disabled" }, { status: 404 }),
      origin
    );
  }

  return isApi ? applyMobileCors(NextResponse.next(), origin) : NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};

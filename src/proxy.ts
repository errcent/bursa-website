import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { checkApiRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import { verifyWebSessionTokenEdge } from "@/lib/auth/web-session-edge";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session.constants";
import {
  isKomunitasApiPath,
  KOMUNITAS_ENABLED,
} from "@/lib/features/komunitas";

const CANONICAL_HOST = "bursanalar.com";

const MOBILE_DEV_ORIGINS = new Set([
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:19006",
  "http://127.0.0.1:19006",
]);

/** Paths that need auth / rate-limit / komunitas guards (not just host redirect). */
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

/** Production-only: force all non-canonical hosts onto bursanalar.com. */
function canonicalHostRedirect(request: NextRequest): NextResponse | null {
  if (process.env.VERCEL_ENV !== "production") return null;

  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (!host || host === CANONICAL_HOST) return null;

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = CANONICAL_HOST;
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export async function proxy(request: NextRequest) {
  const hostRedirect = canonicalHostRedirect(request);
  if (hostRedirect) return hostRedirect;

  const { pathname } = request.nextUrl;
  if (!needsRequestGuard(pathname)) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");
  const isApi = pathname.startsWith("/api/");

  if (isApi && request.method === "OPTIONS") {
    return applyMobileCors(new NextResponse(null, { status: 204 }), origin);
  }

  if (isApi) {
    const rate = checkApiRateLimit(request);
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

  if (
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/developer") ||
      pathname.startsWith("/mentor")) &&
    !sessionOk
  ) {
    const login = new URL("/masuk", request.url);
    login.searchParams.set("next", pathname);
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

  // Page routes render their own coming-soon UI when komunitas is disabled.
  return isApi ? applyMobileCors(NextResponse.next(), origin) : NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Broad match so production host redirect covers all pages.
     * Skip Next internals and common static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};

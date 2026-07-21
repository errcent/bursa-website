import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { checkApiRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import {
  isKomunitasApiPath,
  isKomunitasPagePath,
  KOMUNITAS_ENABLED,
} from "@/lib/features/komunitas";

const MOBILE_DEV_ORIGINS = new Set([
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:19006",
  "http://127.0.0.1:19006",
]);

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

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  if (isApi && request.method === "OPTIONS") {
    return applyMobileCors(new NextResponse(null, { status: 204 }), origin);
  }

  if (isApi) {
    const rate = checkApiRateLimit(request);
    if (!rate.allowed) {
      return applyMobileCors(rateLimitResponse(rate.retryAfterSec), origin);
    }
  }

  if (KOMUNITAS_ENABLED) {
    return isApi ? applyMobileCors(NextResponse.next(), origin) : NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (isKomunitasApiPath(pathname)) {
    return applyMobileCors(
      NextResponse.json({ error: "Komunitas feature disabled" }, { status: 404 }),
      origin
    );
  }

  if (isKomunitasPagePath(pathname)) {
    return NextResponse.redirect(new URL("/bantuan", request.url));
  }

  return isApi ? applyMobileCors(NextResponse.next(), origin) : NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/komunitas",
    "/komunitas/:path*",
    "/admin/chat-rooms/:path*",
    "/mentor/chat/:path*",
    "/api/chat/:path*",
    "/api/trading/:path*",
    "/api/admin/chat-rooms/:path*",
    "/api/admin/collaboration-chat/:path*",
    "/api/admin/branch-change-requests/:path*",
    "/api/mentor/collaboration-chat/:path*",
    "/api/mentor/chat-rooms/:path*",
    "/api/mentor/branch-change-requests/:path*",
  ],
};

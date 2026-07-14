import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { checkApiRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import {
  isKomunitasApiPath,
  isKomunitasPagePath,
  KOMUNITAS_ENABLED,
} from "@/lib/features/komunitas";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const rate = checkApiRateLimit(request);
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfterSec);
    }
  }

  if (KOMUNITAS_ENABLED) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (isKomunitasApiPath(pathname)) {
    return NextResponse.json({ error: "Komunitas feature disabled" }, { status: 404 });
  }

  if (isKomunitasPagePath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
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

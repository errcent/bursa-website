import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { revokeRefreshToken } from "@/lib/auth/mobile-jwt";

const logoutSchema = z.object({
  refreshToken: z.string().min(20),
});

export async function POST(request: NextRequest) {
  try {
    const body = logoutSchema.parse(await request.json());
    const ok = await revokeRefreshToken(body.refreshToken);
    if (!ok) {
      return jsonError("Token tidak ditemukan.", 404);
    }
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

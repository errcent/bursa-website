import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser, resolveTrustedEmail } from "@/lib/auth/request-identity";
import { isPrototypeMode } from "@/lib/auth/prototype";
import { ensureUserSchema } from "@/lib/auth/validation";
import { resolveRequestUser } from "@/lib/lesson-qa/server";

/**
 * Bridge client-auth (localStorage) registrants into Prisma.
 * Called after signup/login so chat enroll/send never hit a missing User row.
 */
export async function POST(request: NextRequest) {
  try {
    const body = ensureUserSchema.parse(await request.json());
    const bodyEmail = body.email.trim().toLowerCase();
    const trustedEmail = await resolveTrustedEmail(request);

    if (trustedEmail) {
      if (trustedEmail !== bodyEmail) {
        return jsonError("Email tidak cocok dengan sesi.", 403);
      }
    } else if (!isPrototypeMode()) {
      return jsonError("Autentikasi diperlukan.", 401);
    } else {
      const headerEmail = request.headers.get("x-user-email")?.trim().toLowerCase();
      if (!headerEmail || headerEmail !== bodyEmail) {
        return jsonError("Autentikasi diperlukan.", 401);
      }
    }

    const user = await resolveRequestUser(
      {
        userId:
          body.userId?.trim() ||
          request.headers.get("x-user-id")?.trim() ||
          bodyEmail,
        email: bodyEmail,
        name:
          body.name?.trim() ||
          request.headers.get("x-user-name")?.trim() ||
          undefined,
        username: body.username?.trim(),
        phone: body.phone,
        role:
          body.role ||
          request.headers.get("x-user-role")?.trim() ||
          undefined,
      },
      { createIfMissing: true }
    );

    if (!user) {
      return jsonError("Gagal memastikan akun pengguna.", 500);
    }

    return jsonOk({
      user: {
        id: user.id,
        email: user.email,
        name: user.nama,
        username: user.username,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveRequestUser } from "@/lib/lesson-qa/server";

const ensureUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120).optional(),
  role: z.string().optional(),
  userId: z.string().optional(),
});

/**
 * Bridge client-auth (localStorage) registrants into Prisma.
 * Called after signup/login so chat enroll/send never hit a missing User row.
 */
export async function POST(request: NextRequest) {
  try {
    const body = ensureUserSchema.parse(await request.json());
    const email = body.email.trim().toLowerCase();
    const headerEmail = request.headers.get("x-user-email")?.trim().toLowerCase();

    // Prefer body email; allow header as fallback when body omits it.
    const resolvedEmail = email || headerEmail;
    if (!resolvedEmail) {
      return jsonError("Email diperlukan.", 400);
    }

    const user = await resolveRequestUser(
      {
        userId:
          body.userId?.trim() ||
          request.headers.get("x-user-id")?.trim() ||
          resolvedEmail,
        email: resolvedEmail,
        name:
          body.name?.trim() ||
          request.headers.get("x-user-name")?.trim() ||
          undefined,
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
        role: user.role,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

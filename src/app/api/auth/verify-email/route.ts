import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { verifyUserEmail } from "@/lib/auth/email-verification";

const verifySchema = z.object({
  token: z.string().min(32, "Token tidak valid."),
});

export async function POST(request: NextRequest) {
  try {
    const body = verifySchema.parse(await request.json());
    const result = await verifyUserEmail(body.token);

    if (!result.valid) {
      return jsonError(
        result.reason === "expired"
          ? "Tautan verifikasi sudah kedaluwarsa. Minta tautan baru dari halaman masuk."
          : "Tautan verifikasi tidak valid.",
        400
      );
    }

    return jsonOk({
      ok: true,
      email: result.email,
      alreadyVerified: result.alreadyVerified,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

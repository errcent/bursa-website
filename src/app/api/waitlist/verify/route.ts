import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { verifyWaitlistEmail } from "@/lib/waitlist/verification";

const verifySchema = z.object({
  token: z.string().min(32, "Token tidak valid."),
});

export async function POST(request: NextRequest) {
  try {
    const body = verifySchema.parse(await request.json());
    const result = await verifyWaitlistEmail(body.token);

    if (!result.valid) {
      return jsonError(
        result.reason === "expired"
          ? "Tautan ini sudah tidak berlaku. Waitlist tidak memerlukan verifikasi email — daftar langsung di halaman waitlist."
          : "Tautan tidak valid. Waitlist tidak memerlukan verifikasi email — daftar langsung di halaman waitlist.",
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

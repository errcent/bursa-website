import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/auth/rate-limit";
import { CONSENT_POLICY_VERSION } from "@/lib/privacy/consent";
import { hashIp } from "@/lib/privacy/otp";

const schema = z.object({
  visitorId: z.string().min(8),
  categories: z.object({
    essential: z.literal(true),
    functional: z.boolean(),
    analytics: z.boolean(),
  }),
  version: z.string().optional(),
  locale: z.enum(["id", "en"]).optional(),
});

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limit = await checkRateLimit(`consent:${ip}`, 20, 60 * 60 * 1000);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfterSec);
    }

    const body = schema.parse(await request.json());

    await db.cookieConsentRecord.create({
      data: {
        visitorId: body.visitorId,
        categories: body.categories,
        version: body.version ?? CONSENT_POLICY_VERSION,
        locale: body.locale ?? "id",
        ipHash: hashIp(ip),
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Gagal menyimpan preferensi." }, { status: 500 });
  }
}

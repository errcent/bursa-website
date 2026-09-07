import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/auth/rate-limit";
import { hashOtp } from "@/lib/privacy/otp";

const schema = z.object({
  email: z.string().email(),
  referenceCode: z.string().min(8),
  otp: z.string().length(6),
});

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limit = await checkRateLimit(`dsar-status:${ip}`, 10, 15 * 60 * 1000);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfterSec);
    }

    const body = schema.parse(await request.json());
    const referenceCode = body.referenceCode.toUpperCase();
    const otpHash = hashOtp(body.email.toLowerCase(), referenceCode, body.otp);

    const otpRecord = await db.dsarStatusOtp.findFirst({
      where: {
        email: body.email,
        referenceCode,
        otpHash,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: "Kode verifikasi tidak valid atau kedaluwarsa." }, { status: 403 });
    }

    const record = await db.dataSubjectRequest.findFirst({
      where: {
        email: { equals: body.email, mode: "insensitive" },
        referenceCode,
      },
    });

    if (!record) {
      return NextResponse.json({ error: "Permintaan tidak ditemukan." }, { status: 404 });
    }

    await db.dsarStatusOtp.deleteMany({ where: { email: body.email, referenceCode } });

    return NextResponse.json({
      referenceCode: record.referenceCode,
      requestType: record.requestType,
      status: record.status,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat status." }, { status: 500 });
  }
}

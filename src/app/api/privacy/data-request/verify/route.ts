import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email/send";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/auth/rate-limit";
import { dsarOtpEmail } from "@/lib/privacy/email-templates";
import { generateOtp, hashOtp } from "@/lib/privacy/otp";
import type { LegalLocale } from "@/lib/hosts/hosts";

const schema = z.object({
  email: z.string().email(),
  referenceCode: z.string().min(8),
  locale: z.enum(["id", "en"]).optional(),
});

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limit = await checkRateLimit(`dsar-otp:${ip}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfterSec);
    }

    const body = schema.parse(await request.json());
    const locale: LegalLocale = body.locale ?? "id";
    const email = body.email.toLowerCase();
    const referenceCode = body.referenceCode.toUpperCase();

    const record = await db.dataSubjectRequest.findFirst({
      where: { email: { equals: body.email, mode: "insensitive" }, referenceCode },
    });

    if (!record) {
      return NextResponse.json(
        { error: locale === "en" ? "Request not found." : "Permintaan tidak ditemukan." },
        { status: 404 }
      );
    }

    const otp = generateOtp();
    const otpHash = hashOtp(email, referenceCode, otp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.dsarStatusOtp.deleteMany({ where: { email: body.email, referenceCode } });
    await db.dsarStatusOtp.create({
      data: { email: body.email, referenceCode, otpHash, expiresAt },
    });

    const mail = dsarOtpEmail(locale, { otp, referenceCode });
    const sent = await sendTransactionalEmail({
      category: "privacy_dsar",
      to: body.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    if (!sent.ok && process.env.NODE_ENV === "development") {
      console.info("[dsar-otp-dev]", referenceCode, otp);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Gagal mengirim kode verifikasi." }, { status: 500 });
  }
}

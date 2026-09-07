import { NextResponse } from "next/server";
import { z } from "zod";
import type { DataSubjectRequestType, DataSubjectType } from "@prisma/client";

import { db } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email/send";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import {
  checkRateLimit,
  clientIp,
  rateLimitResponse,
} from "@/lib/auth/rate-limit";
import { dsarConfirmationEmail } from "@/lib/privacy/email-templates";
import { generateDsarReferenceCode } from "@/lib/privacy/reference-code";
import type { LegalLocale } from "@/lib/hosts/hosts";

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  requestType: z.enum([
    "ACCESS",
    "CORRECTION",
    "DELETION",
    "WITHDRAW_CONSENT",
    "OBJECTION",
    "PORTABILITY",
  ]),
  subjectType: z.enum(["ACCOUNT", "NON_ACCOUNT", "MENTOR_APPLICANT"]).optional(),
  details: z.string().min(10),
  locale: z.enum(["id", "en"]).optional(),
});

const IDENTITY_REQUIRED: DataSubjectRequestType[] = [
  "DELETION",
  "WITHDRAW_CONSENT",
  "PORTABILITY",
];

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limit = await checkRateLimit(`dsar:${ip}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfterSec);
    }

    const body = schema.parse(await request.json());
    const requestType = body.requestType as DataSubjectRequestType;
    const locale: LegalLocale = body.locale ?? "id";

    const viewer = await resolveAuthenticatedUser(request, { createIfMissing: false });
    if (IDENTITY_REQUIRED.includes(requestType)) {
      if (!viewer) {
        return NextResponse.json(
          {
            error:
              locale === "en"
                ? "Sign in and verify identity for this request type."
                : "Masuk dan verifikasi identitas untuk permintaan ini.",
          },
          { status: 401 }
        );
      }
      if (viewer.email.toLowerCase() !== body.email.toLowerCase()) {
        return NextResponse.json(
          {
            error:
              locale === "en"
                ? "Request email must match your verified account."
                : "Email permintaan harus sama dengan akun terverifikasi kamu.",
          },
          { status: 403 }
        );
      }
    }

    const referenceCode = generateDsarReferenceCode();

    const record = await db.dataSubjectRequest.create({
      data: {
        referenceCode,
        fullName: body.fullName,
        email: body.email,
        requestType,
        subjectType: (body.subjectType as DataSubjectType | undefined) ?? null,
        details: body.details,
      },
    });

    const mail = dsarConfirmationEmail(locale, {
      fullName: body.fullName,
      referenceCode,
    });
    void sendTransactionalEmail({
      category: "privacy_dsar",
      to: body.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    return NextResponse.json({ id: record.id, referenceCode: record.referenceCode }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Gagal menyimpan permintaan. Email privacy@bursanalar.com sebagai alternatif." },
      { status: 500 }
    );
  }
}

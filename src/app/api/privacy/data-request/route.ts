import { NextResponse } from "next/server";
import { z } from "zod";
import type { DataSubjectRequestType } from "@prisma/client";

import { db } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import {
  checkRateLimit,
  clientIp,
  rateLimitResponse,
} from "@/lib/auth/rate-limit";

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
  details: z.string().min(10),
});

/** Destructive request types must never be self-executed — they require a verified
 * account + admin action downstream (QC-20260719-24). */
const IDENTITY_REQUIRED: DataSubjectRequestType[] = [
  "DELETION",
  "WITHDRAW_CONSENT",
  "PORTABILITY",
];

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limit = checkRateLimit(`dsar:${ip}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfterSec);
    }

    const body = schema.parse(await request.json());
    const requestType = body.requestType as DataSubjectRequestType;

    // High-impact requests require an authenticated identity whose email matches the
    // request, so nobody can trigger deletion/portability for another person. The
    // actual destructive action stays admin-gated (this endpoint only records intent).
    const viewer = await resolveAuthenticatedUser(request, { createIfMissing: false });
    if (IDENTITY_REQUIRED.includes(requestType)) {
      if (!viewer) {
        return NextResponse.json(
          { error: "Masuk dan verifikasi identitas untuk permintaan ini." },
          { status: 401 }
        );
      }
      if (viewer.email.toLowerCase() !== body.email.toLowerCase()) {
        return NextResponse.json(
          { error: "Email permintaan harus sama dengan akun terverifikasi kamu." },
          { status: 403 }
        );
      }
    }

    const record = await db.dataSubjectRequest.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        requestType,
        details: body.details,
      },
    });

    return NextResponse.json({ id: record.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Gagal menyimpan permintaan. Email privacy@bursa.id sebagai alternatif." },
      { status: 500 }
    );
  }
}

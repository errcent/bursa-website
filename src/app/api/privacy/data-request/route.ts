import { NextResponse } from "next/server";
import { z } from "zod";
import type { DataSubjectRequestType } from "@prisma/client";

import { db } from "@/lib/db";

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

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());

    const record = await db.dataSubjectRequest.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        requestType: body.requestType as DataSubjectRequestType,
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

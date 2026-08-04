import { Prisma } from "@prisma/client";
import { after, NextRequest } from "next/server";
import bcrypt from "bcryptjs";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { checkRateLimit, clientIp } from "@/lib/auth/rate-limit";
import {
  signWebSessionToken,
  webSessionCookieOptions,
  WEB_SESSION_COOKIE,
} from "@/lib/auth/web-session";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/auth/validation";
import { createEmailVerificationToken } from "@/lib/auth/email-verification";
import { sendAccountVerificationEmail } from "@/lib/auth/auth-email";
import { markWaitlistConverted } from "@/lib/waitlist/resend";

/** bcrypt cost ≥ 12 per security docs (folder 18). */
const BCRYPT_COST = 12;

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rate = checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000);
    if (!rate.allowed) {
      return jsonError(
        `Terlalu banyak percobaan daftar. Coba lagi dalam ${rate.retryAfterSec} detik.`,
        429
      );
    }

    const body = registerSchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(body.password, BCRYPT_COST);

    const user = await db.user.create({
      data: {
        email: body.email,
        username: body.username,
        phone: body.phone ?? null,
        nama: body.name,
        passwordHash,
        role: "LEARNER",
      },
    });

    const verifyToken = await createEmailVerificationToken(user.id);
    // after() keeps the send off the response path while still guaranteeing it runs —
    // a bare floating promise can be dropped when the serverless instance freezes.
    after(async () => {
      await Promise.all([
        sendAccountVerificationEmail({
          email: user.email,
          name: user.nama,
          token: verifyToken,
        }),
        markWaitlistConverted(user.email),
      ]);
    });

    const token = await signWebSessionToken({ id: user.id, email: user.email });
    const response = jsonOk(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.nama,
          username: user.username,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          emailVerified: false,
        },
        verificationEmailSent: true,
      },
      201
    );
    response.cookies.set(WEB_SESSION_COOKIE, token, webSessionCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("Akun dengan data tersebut sudah terdaftar.", 409);
    }
    return handleApiError(error);
  }
}

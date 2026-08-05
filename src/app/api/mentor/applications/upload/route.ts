import { NextRequest, NextResponse } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/auth/rate-limit";
import { persistMentorApplicationDocument } from "@/lib/mentor-program/document-storage";
import {
  isTurnstileBlockingMisconfiguration,
  isTurnstileConfigured,
  verifyTurnstileToken,
} from "@/lib/turnstile/verify";
import { assertDetectedFileType } from "@/lib/upload/validate-file";

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rate = checkRateLimit(`mentor-upload:${ip}`, 10, 60 * 60 * 1000);
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfterSec);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const kindRaw = String(formData.get("kind") ?? "cv").trim();
    const turnstileToken = String(formData.get("turnstileToken") ?? "").trim();

    if (isTurnstileBlockingMisconfiguration()) {
      return jsonError("Unggahan sementara tidak tersedia. Coba lagi nanti.", 503);
    }

    if (isTurnstileConfigured()) {
      if (!turnstileToken) {
        return jsonError("Verifikasi keamanan wajib. Muat ulang halaman dan coba lagi.", 400);
      }
      const valid = await verifyTurnstileToken(turnstileToken, ip);
      if (!valid) {
        return jsonError("Verifikasi keamanan gagal. Muat ulang halaman dan coba lagi.", 400);
      }
    }

    if (!(file instanceof File)) {
      return jsonError("File wajib diunggah.", 400);
    }

    if (kindRaw !== "cv" && kindRaw !== "certificate") {
      return jsonError("Jenis dokumen tidak valid.", 400);
    }

    if (file.size > MAX_BYTES) {
      return jsonError("Ukuran file maksimal 5 MB.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let detected;
    try {
      detected = assertDetectedFileType(buffer, ALLOWED_TYPES);
    } catch {
      return jsonError("Format tidak didukung. Gunakan PDF, JPG, PNG, atau WebP.", 400);
    }

    const { url, storage } = await persistMentorApplicationDocument(
      kindRaw,
      buffer,
      detected.mime,
      detected.ext
    );

    return jsonOk(
      {
        url,
        fileName: file.name,
        storage,
        kind: kindRaw,
      },
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Body exceeded")) {
      return jsonError("Ukuran file maksimal 5 MB.", 413);
    }
    return handleApiError(error);
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

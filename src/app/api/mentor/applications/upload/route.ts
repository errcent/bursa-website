import { NextResponse } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { persistMentorApplicationDocument } from "@/lib/mentor-program/document-storage";

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function extForMime(mimeType: string): string | null {
  switch (mimeType) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const kindRaw = String(formData.get("kind") ?? "cv").trim();

    if (!(file instanceof File)) {
      return jsonError("File wajib diunggah.", 400);
    }

    if (kindRaw !== "cv" && kindRaw !== "certificate") {
      return jsonError("Jenis dokumen tidak valid.", 400);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError("Format tidak didukung. Gunakan PDF, JPG, PNG, atau WebP.", 400);
    }

    if (file.size > MAX_BYTES) {
      return jsonError("Ukuran file maksimal 5 MB.", 400);
    }

    const ext = extForMime(file.type);
    if (!ext) {
      return jsonError("Format tidak didukung.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, storage } = await persistMentorApplicationDocument(
      kindRaw,
      buffer,
      file.type,
      ext
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

import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_PREFIX = "/uploads/mentor-applications/";

function isReadOnlyDeploy() {
  return process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME != null;
}

function dataUrlFor(mimeType: string, buffer: Buffer) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function safeFileName(kind: string, ext: string) {
  return `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

export function isMentorApplicationDocumentUrl(url: string | null | undefined): boolean {
  return typeof url === "string" && (url.startsWith(UPLOAD_PREFIX) || url.startsWith("data:"));
}

/**
 * Persist mentor application documents (CV, certificates).
 * Local dev writes to public/uploads/mentor-applications/; serverless uses inline data URLs.
 */
export async function persistMentorApplicationDocument(
  kind: "cv" | "certificate",
  buffer: Buffer,
  mimeType: string,
  ext: string
): Promise<{ url: string; storage: "file" | "inline" }> {
  if (isReadOnlyDeploy()) {
    return { url: dataUrlFor(mimeType, buffer), storage: "inline" };
  }

  const safeName = safeFileName(kind, ext);
  const uploadDir = path.join(process.cwd(), "public", "uploads", "mentor-applications");
  const filePath = path.join(uploadDir, safeName);

  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, buffer);
    return { url: `${UPLOAD_PREFIX}${safeName}`, storage: "file" };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "EROFS" || code === "EPERM" || code === "EACCES") {
      return { url: dataUrlFor(mimeType, buffer), storage: "inline" };
    }
    throw error;
  }
}

import { mkdir, writeFile } from "fs/promises";
import path from "path";

/** Vercel/serverless deployments only allow ephemeral writes (not under public/). */
function isReadOnlyDeploy() {
  return process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME != null;
}

function dataUrlFor(mimeType: string, buffer: Buffer) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function safeFileName(userId: string, ext: string) {
  return `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

/**
 * Persist an avatar and return a URL usable in <img src>.
 * - Local dev: writes to public/uploads/avatars/
 * - Vercel/serverless: stores inline data URL (DB-backed; survives cold starts)
 */
export async function persistAvatar(
  userId: string,
  buffer: Buffer,
  mimeType: string,
  ext: string
): Promise<{ avatarUrl: string; storage: "file" | "inline" }> {
  if (isReadOnlyDeploy()) {
    return { avatarUrl: dataUrlFor(mimeType, buffer), storage: "inline" };
  }

  const safeName = safeFileName(userId, ext);
  const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
  const filePath = path.join(uploadDir, safeName);

  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, buffer);
    return { avatarUrl: `/uploads/avatars/${safeName}`, storage: "file" };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "EROFS" || code === "EPERM" || code === "EACCES") {
      return { avatarUrl: dataUrlFor(mimeType, buffer), storage: "inline" };
    }
    throw error;
  }
}

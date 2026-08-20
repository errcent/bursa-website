const UPLOAD_PREFIX = "/uploads/mentor-applications/";

export function isMentorApplicationDocumentUrl(url: string | null | undefined): boolean {
  return typeof url === "string" && (url.startsWith(UPLOAD_PREFIX) || url.startsWith("data:"));
}

/** Retired. L1 has no files; L2 uses private URLs. Do not write public/uploads. */
export async function persistMentorApplicationDocument(
  _kind: "cv" | "certificate",
  _buffer: Buffer,
  _mimeType: string,
  _ext: string
): Promise<{ url: string; storage: "file" | "inline" }> {
  throw new Error("Mentor application file upload is retired (BN-SEC-007). Use private URLs.");
}

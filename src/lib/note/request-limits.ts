import { NextRequest } from "next/server";

export function contentLength(request: NextRequest): number | null {
  const raw = request.headers.get("content-length");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function isBodyTooLarge(request: NextRequest, maxBytes: number): boolean {
  const len = contentLength(request);
  return len != null && len > maxBytes;
}

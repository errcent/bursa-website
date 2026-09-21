import { NextResponse } from "next/server";

import { requireAdmin, unauthorized } from "@/lib/admin/server";
import { isImageStudioEnabled } from "@/lib/image-studio/config";

export function studioDisabledResponse() {
  return NextResponse.json(
    { error: "Image Studio tidak tersedia di environment ini." },
    { status: 404 }
  );
}

export function assertImageStudioEnabled() {
  if (!isImageStudioEnabled()) {
    return studioDisabledResponse();
  }
  return null;
}

/** U-002: Studio is admin-only when enabled. */
export async function assertImageStudioAdmin(request: Request) {
  const disabled = assertImageStudioEnabled();
  if (disabled) return { error: disabled as NextResponse };

  const admin = await requireAdmin(request);
  if (!admin) return { error: unauthorized() };

  return { admin };
}

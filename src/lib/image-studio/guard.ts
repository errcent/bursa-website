import { NextResponse } from "next/server";

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

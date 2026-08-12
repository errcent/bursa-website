import { NextResponse } from "next/server";

import { assertImageStudioEnabled } from "@/lib/image-studio/guard";
import { buildStudioStatus } from "@/lib/image-studio/registry";

export async function GET() {
  const disabled = assertImageStudioEnabled();
  if (disabled) return disabled;

  const status = await buildStudioStatus();
  return NextResponse.json(status);
}

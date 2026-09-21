import { NextResponse } from "next/server";

import { assertImageStudioAdmin } from "@/lib/image-studio/guard";
import { buildStudioStatus } from "@/lib/image-studio/registry";

export async function GET(request: Request) {
  const gate = await assertImageStudioAdmin(request);
  if ("error" in gate) return gate.error;

  const status = await buildStudioStatus();
  return NextResponse.json(status);
}

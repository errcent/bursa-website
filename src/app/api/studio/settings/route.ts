import { NextResponse } from "next/server";
import { z } from "zod";

import { assertImageStudioEnabled } from "@/lib/image-studio/guard";
import { readStudioSettings, writeStudioSettings } from "@/lib/image-studio/settings";

const patchSchema = z.object({
  openaiBudgetUsd: z.number().min(0).nullable().optional(),
  googleBudgetUsd: z.number().min(0).nullable().optional(),
});

export async function GET() {
  const disabled = assertImageStudioEnabled();
  if (disabled) return disabled;

  const settings = await readStudioSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const disabled = assertImageStudioEnabled();
  if (disabled) return disabled;

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  const settings = await writeStudioSettings(body);
  return NextResponse.json({ settings });
}

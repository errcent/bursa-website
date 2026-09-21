import { NextResponse } from "next/server";
import { z } from "zod";

import { assertImageStudioAdmin } from "@/lib/image-studio/guard";
import { readStudioSettings, writeStudioSettings } from "@/lib/image-studio/settings";

const patchSchema = z.object({
  openaiBudgetUsd: z.number().min(0).nullable().optional(),
  googleBudgetUsd: z.number().min(0).nullable().optional(),
});

export async function GET(request: Request) {
  const gate = await assertImageStudioAdmin(request);
  if ("error" in gate) return gate.error;

  const settings = await readStudioSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const gate = await assertImageStudioAdmin(request);
  if ("error" in gate) return gate.error;

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  const settings = await writeStudioSettings(body);
  return NextResponse.json({ settings });
}

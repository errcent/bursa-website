import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, unauthorized } from "@/lib/admin/server";
import {
  approveWaitlistLifecycle,
  getWaitlistLifecycleApprovalState,
  revokeWaitlistLifecycleApproval,
} from "@/lib/waitlist/lifecycle-approval";

const approvalSchema = z.object({
  action: z.enum(["approve", "revoke"]),
  note: z.string().max(500).optional(),
});

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const state = await getWaitlistLifecycleApprovalState();
  return NextResponse.json(state);
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const body = approvalSchema.parse(await request.json());

  if (body.action === "approve") {
    await approveWaitlistLifecycle({
      approvedByUserId: admin.id,
      note: body.note,
    });
  } else {
    await revokeWaitlistLifecycleApproval(admin.id);
  }

  const state = await getWaitlistLifecycleApprovalState();
  return NextResponse.json({ ok: true, ...state });
}

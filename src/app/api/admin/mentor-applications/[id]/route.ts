import { MentorApplicationStatus } from "@prisma/client";
import { after } from "next/server";

import { jsonError } from "@/lib/api-utils";
import { requireAdmin, requireAdminPanel, unauthorized } from "@/lib/admin/server";
import {
  getMentorApplicationById,
  issueL2Token,
  transitionApplication,
} from "@/lib/mentor-program/applications";
import { drainMentorApplicationOutbox } from "@/lib/mentor-program/outbox";
import { adminApplicationDecisionSchema } from "@/lib/validations/mentor-application";

type RouteContext = { params: Promise<{ id: string }> };

const ACTION_TO_STATUS: Record<
  Exclude<
    (typeof adminApplicationDecisionSchema)["_output"]["action"],
    "invite_l2"
  >,
  MentorApplicationStatus
> = {
  reject: MentorApplicationStatus.REJECTED,
  talent_pool: MentorApplicationStatus.TALENT_POOL,
  info_required: MentorApplicationStatus.INFO_REQUIRED,
  revision_required: MentorApplicationStatus.REVISION_REQUIRED,
  mark_review: MentorApplicationStatus.REVIEW,
  mark_assessment: MentorApplicationStatus.ASSESSMENT,
  mark_final_review: MentorApplicationStatus.FINAL_REVIEW,
  approve: MentorApplicationStatus.APPROVED,
  onboarding: MentorApplicationStatus.ONBOARDING,
  production_ready: MentorApplicationStatus.PRODUCTION_READY,
};

export async function GET(request: Request, context: RouteContext) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;
  const application = await getMentorApplicationById(id);
  if (!application) return jsonError("Aplikasi tidak ditemukan.", 404);
  return Response.json(application);
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminApplicationDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues.map((issue) => issue.message).join(", "), 422);
    }

    if (parsed.data.action === "invite_l2") {
      const result = await issueL2Token(id, admin.email, parsed.data.note);
      after(async () => {
        try {
          await drainMentorApplicationOutbox();
        } catch (error) {
          console.error("[admin-mentor-application] outbox drain failed:", error);
        }
      });
      return Response.json({
        application: result.application,
        l2Url: result.url,
        token: result.token,
      });
    }

    const to = ACTION_TO_STATUS[parsed.data.action];
    const application = await transitionApplication({
      id,
      to,
      actorEmail: admin.email,
      note: parsed.data.note,
    });

    after(async () => {
      try {
        await drainMentorApplicationOutbox();
      } catch (error) {
        console.error("[admin-mentor-application] outbox drain failed:", error);
      }
    });

    return Response.json({ application });
  } catch (error) {
    if (error instanceof Error) {
      return jsonError(error.message, 409);
    }
    return jsonError("Gagal memperbarui aplikasi.", 500);
  }
}

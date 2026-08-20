import { MentorApplicationStatus } from "@prisma/client";
import { after } from "next/server";

import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireAdmin, requireAdminPanel, unauthorized } from "@/lib/admin/server";
import {
  createDirectInvite,
  listMentorApplications,
} from "@/lib/mentor-program/applications";
import { drainMentorApplicationOutbox } from "@/lib/mentor-program/outbox";
import { adminDirectInviteSchema } from "@/lib/validations/mentor-application";

const STATUSES = new Set<string>(Object.values(MentorApplicationStatus));

export async function GET(request: Request) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const statusRaw = searchParams.get("status");
    const status =
      statusRaw && STATUSES.has(statusRaw)
        ? (statusRaw as MentorApplicationStatus)
        : undefined;
    const items = await listMentorApplications(status);
    return Response.json(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    const parsed = adminDirectInviteSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues.map((issue) => issue.message).join(", "), 422);
    }

    const result = await createDirectInvite({
      ...parsed.data,
      actorEmail: admin.email,
    });

    after(async () => {
      try {
        await drainMentorApplicationOutbox();
      } catch (error) {
        console.error("[admin-mentor-applications] outbox drain failed:", error);
      }
    });

    return Response.json(
      {
        application: result.application,
        l2Url: result.url,
        token: result.token,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

import { after } from "next/server";
import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/auth/rate-limit";
import { openL2Portal, saveL2Draft, submitL2 } from "@/lib/mentor-program/applications";
import { drainMentorApplicationOutbox } from "@/lib/mentor-program/outbox";
import {
  mentorL2DraftSchema,
  mentorL2SubmitSchema,
} from "@/lib/validations/mentor-application";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const opened = await openL2Portal(token);
    if (!opened) {
      return jsonError("Tautan tidak valid atau kedaluwarsa.", 404);
    }
    return jsonOk({
      application: opened.application,
      readOnly: opened.readOnly,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const ip = clientIp(request);
    const rate = await checkRateLimit(`mentor-l2:${ip}`, 30, 60 * 60 * 1000);
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfterSec);
    }

    const { token } = await context.params;
    const body = (await request.json()) as { intent?: string; answers?: unknown };
    const intent = body.intent === "submit" ? "submit" : "draft";
    const parsed =
      intent === "submit"
        ? mentorL2SubmitSchema.safeParse(body.answers)
        : mentorL2DraftSchema.safeParse(body.answers);

    if (!parsed.success) {
      return jsonError(parsed.error.issues.map((issue) => issue.message).join(", "), 422);
    }

    const application =
      intent === "submit"
        ? await submitL2(token, parsed.data)
        : await saveL2Draft(token, parsed.data);

    if (intent === "submit") {
      after(async () => {
        try {
          await drainMentorApplicationOutbox();
        } catch (error) {
          console.error("[mentor-l2] outbox drain failed:", error);
        }
      });
    }

    return jsonOk({ application, intent });
  } catch (error) {
    if (error instanceof Error && /tidak valid|kedaluwarsa|dikunci/i.test(error.message)) {
      return jsonError(error.message, 409);
    }
    return handleApiError(error);
  }
}

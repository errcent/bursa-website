import { NextResponse } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { notifyAdminOfMentorApplication } from "@/lib/mentor-program/application-notification";
import { createMentorApplication } from "@/lib/mentor-program/applications";
import { mentorApplicationSchema } from "@/lib/validations/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = mentorApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues.map((i) => i.message).join(", "), 422);
    }

    const { portfolioUrl, certificateDocumentUrl, certificateDocumentName, ...rest } = parsed.data;
    const application = await createMentorApplication({
      ...rest,
      portfolioUrl: portfolioUrl || undefined,
      certificateDocumentUrl: certificateDocumentUrl || undefined,
      certificateDocumentName: certificateDocumentName || undefined,
    });

    void notifyAdminOfMentorApplication(application).catch((error) => {
      console.error("[mentor-application] Unhandled email error:", error);
    });

    return jsonOk({ id: application.id, status: application.status }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

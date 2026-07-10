import { NextResponse } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { createMentorApplication } from "@/lib/mentor-program/applications";
import { mentorApplicationSchema } from "@/lib/validations/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = mentorApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues.map((i) => i.message).join(", "), 422);
    }

    const { portfolioUrl, ...rest } = parsed.data;
    const application = createMentorApplication({
      ...rest,
      portfolioUrl: portfolioUrl || undefined,
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

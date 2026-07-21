import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { getCourseBySlug, getMentorBySlug } from "@/lib/catalog/server";

type RouteContext = {
  params: Promise<{ courseSlug: string }>;
};

/** Public course detail for mobile catalog / kelas screen. */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug } = await context.params;
    const course = await getCourseBySlug(courseSlug);
    if (!course) {
      return jsonError("Kelas tidak ditemukan.", 404);
    }

    const mentor = await getMentorBySlug(course.mentorSlug);

    return jsonOk({ course, mentor });
  } catch (error) {
    return handleApiError(error);
  }
}

import { handleApiError, jsonOk } from "@/lib/api-utils";
import { getCatalogCourses, getCatalogMentors } from "@/lib/catalog/server";

/** Public catalog listing for client search and dashboard recommendations. */
export async function GET() {
  try {
    const [courses, mentors] = await Promise.all([
      getCatalogCourses(),
      getCatalogMentors(),
    ]);
    return jsonOk({ courses, mentors });
  } catch (error) {
    return handleApiError(error);
  }
}

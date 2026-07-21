import { handleApiError, jsonOk } from "@/lib/api-utils";
import { getCatalogData } from "@/lib/catalog/server";

/** Public catalog listing for client search and dashboard recommendations. */
export async function GET() {
  try {
    const { courses, mentors } = await getCatalogData();
    return jsonOk({ courses, mentors });
  } catch (error) {
    return handleApiError(error);
  }
}
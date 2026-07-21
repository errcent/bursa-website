import { jsonError, jsonOk } from "@/lib/api-utils";
import { USER_COMMENTS_DISABLED_MESSAGE } from "@/lib/content-features";

export async function GET() {
  return jsonOk({
    reviews: [],
    eligibility: {
      canReview: false,
      reason: USER_COMMENTS_DISABLED_MESSAGE,
      completedModules: 0,
      totalModules: 0,
      existingReviewId: null,
    },
  });
}

export async function POST() {
  return jsonError(USER_COMMENTS_DISABLED_MESSAGE, 403);
}

import { NextRequest } from "next/server";

import { handleApiError, jsonOk } from "@/lib/api-utils";
import { computeLearningGuidance } from "@/lib/learning/guidance/recommend";
import { learningGuidanceAnswersSchema } from "@/lib/validations/api";

/** Public: compute recommendations from quiz answers without persisting. */
export async function POST(request: NextRequest) {
  try {
    const body = learningGuidanceAnswersSchema.parse(await request.json());
    const result = await computeLearningGuidance(body);
    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}

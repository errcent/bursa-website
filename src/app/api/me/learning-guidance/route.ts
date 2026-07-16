import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { db } from "@/lib/db";
import {
  answersFromProfileRecord,
  answersToProfileData,
  computeLearningGuidance,
  serializeProfileRecord,
} from "@/lib/learning/guidance/recommend";
import { learningGuidanceAnswersSchema } from "@/lib/validations/api";

export async function GET(request: NextRequest) {
  try {
    const user = await resolveAuthenticatedUser(request, { createIfMissing: false });
    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const profile = await db.learningGuidanceProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return jsonOk({ profile: null, result: null });
    }

    const serialized = serializeProfileRecord(profile);
    const answers = answersFromProfileRecord(serialized);
    const result = await computeLearningGuidance(answers, serialized);

    return jsonOk({ profile: serialized, result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = learningGuidanceAnswersSchema.parse(await request.json());

    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: false,
    });

    if (!user) {
      return jsonError("Autentikasi diperlukan untuk menyimpan profil belajar.", 401);
    }

    const data = answersToProfileData(body);

    const profile = await db.learningGuidanceProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...data,
        completedAt: new Date(),
      },
      update: {
        ...data,
        completedAt: new Date(),
      },
    });

    const serialized = serializeProfileRecord(profile);
    const result = await computeLearningGuidance(body, serialized);

    return jsonOk({ profile: serialized, result });
  } catch (error) {
    return handleApiError(error);
  }
}

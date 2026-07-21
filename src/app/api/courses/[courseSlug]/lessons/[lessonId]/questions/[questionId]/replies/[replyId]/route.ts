import { jsonError } from "@/lib/api-utils";
import { USER_COMMENTS_DISABLED_MESSAGE } from "@/lib/content-features";

export async function PATCH() {
  return jsonError(USER_COMMENTS_DISABLED_MESSAGE, 403);
}

export async function DELETE() {
  return jsonError(USER_COMMENTS_DISABLED_MESSAGE, 403);
}

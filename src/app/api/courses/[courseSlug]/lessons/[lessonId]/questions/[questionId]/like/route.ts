import { jsonError } from "@/lib/api-utils";
import { USER_COMMENTS_DISABLED_MESSAGE } from "@/lib/content-features";

export async function POST() {
  return jsonError(USER_COMMENTS_DISABLED_MESSAGE, 403);
}

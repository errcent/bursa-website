import { jsonOk } from "@/lib/api-utils";
import { isGoogleOAuthConfigured } from "@/lib/auth/google-oauth";

export async function GET() {
  return jsonOk({ google: isGoogleOAuthConfigured() });
}

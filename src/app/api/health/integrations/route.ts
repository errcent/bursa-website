import { jsonOk } from "@/lib/api-utils";
import { isGoogleOAuthConfigured } from "@/lib/auth/google-oauth";
import { isEmailConfigured } from "@/lib/email/config";
import { requireAdminPanel, unauthorized } from "@/lib/admin/server";

export async function GET(request: Request) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY?.trim();

  return jsonOk({
    googleOAuth: isGoogleOAuthConfigured(),
    email: isEmailConfigured(),
    turnstile: Boolean(turnstileSiteKey && turnstileSecret),
    fieldEncryption: Boolean(process.env.FIELD_ENCRYPTION_KEY?.trim()),
  });
}

import { after } from "next/server";

import { jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { verifyPreferenceSignature } from "@/lib/waitlist/preferences";
import { syncWaitlistPreferences } from "@/lib/waitlist/resend";
import { waitlistPreferencesSchema } from "@/lib/waitlist/validation";

function signedEntry(request: Request): { id: string; sig: string } | null {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const sig = url.searchParams.get("sig") ?? "";
  return verifyPreferenceSignature(id, sig) ? { id, sig } : null;
}

export async function GET(request: Request) {
  const signed = signedEntry(request);
  if (!signed) return jsonError("Tautan preferensi tidak valid.", 401);

  const entry = await db.waitlistEntry.findUnique({
    where: { id: signed.id },
    select: {
      email: true,
      status: true,
      wantsProductUpdates: true,
      wantsEducation: true,
      wantsLaunchNews: true,
      experienceLevel: true,
      learningGoal: true,
      marketInterest: true,
    },
  });
  if (!entry) return jsonError("Kontak waitlist tidak ditemukan.", 404);

  const [name, domain] = entry.email.split("@");
  const maskedEmail = `${name.slice(0, 2)}***@${domain}`;
  return jsonOk({ ...entry, email: maskedEmail });
}

export async function PATCH(request: Request) {
  const signed = signedEntry(request);
  if (!signed) return jsonError("Tautan preferensi tidak valid.", 401);

  const parsed = waitlistPreferencesSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Preferensi tidak valid.", 400);

  const existing = await db.waitlistEntry.findUnique({
    where: { id: signed.id },
    select: { status: true },
  });
  if (!existing) return jsonError("Kontak waitlist tidak ditemukan.", 404);
  if (existing.status === "SUPPRESSED") {
    return jsonError("Alamat ini disuppress karena masalah deliverability.", 409);
  }

  const allDisabled =
    !parsed.data.wantsProductUpdates &&
    !parsed.data.wantsEducation &&
    !parsed.data.wantsLaunchNews;
  const now = new Date();
  await db.waitlistEntry.update({
    where: { id: signed.id },
    data: {
      ...parsed.data,
      consentGiven: !allDisabled,
      status: allDisabled ? "UNSUBSCRIBED" : "ACTIVE",
      unsubscribedAt: allDisabled ? now : null,
      resendSyncStatus: "PENDING",
      resendSyncError: null,
    },
  });

  after(async () => {
    await syncWaitlistPreferences(signed.id);
  });

  return jsonOk({ ok: true, unsubscribed: allDisabled });
}


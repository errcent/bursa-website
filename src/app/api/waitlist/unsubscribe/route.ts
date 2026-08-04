import { after, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/email/escape";
import { verifyPreferenceSignature } from "@/lib/waitlist/preferences";
import { syncWaitlistPreferences } from "@/lib/waitlist/resend";

function credentials(request: Request): { id: string; sig: string } | null {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const sig = url.searchParams.get("sig") ?? "";
  return verifyPreferenceSignature(id, sig) ? { id, sig } : null;
}

async function unsubscribe(entryId: string): Promise<boolean> {
  const entry = await db.waitlistEntry.findUnique({
    where: { id: entryId },
    select: { status: true },
  });
  if (!entry) return false;

  if (entry.status !== "UNSUBSCRIBED" && entry.status !== "SUPPRESSED") {
    await db.waitlistEntry.update({
      where: { id: entryId },
      data: {
        status: "UNSUBSCRIBED",
        consentGiven: false,
        unsubscribedAt: new Date(),
        wantsProductUpdates: false,
        wantsEducation: false,
        wantsLaunchNews: false,
        resendSyncStatus: "PENDING",
        resendSyncError: null,
      },
    });
  }

  after(async () => {
    await syncWaitlistPreferences(entryId);
  });
  return true;
}

export async function GET(request: Request) {
  const signed = credentials(request);
  if (!signed) {
    return NextResponse.redirect(`${getSiteUrl()}/email-preferences?error=invalid-link`);
  }

  const found = await unsubscribe(signed.id);
  const query = new URLSearchParams({
    id: signed.id,
    sig: signed.sig,
    ...(found ? { unsubscribed: "1" } : { error: "not-found" }),
  });
  return NextResponse.redirect(`${getSiteUrl()}/email-preferences?${query.toString()}`);
}

export async function POST(request: Request) {
  const signed = credentials(request);
  if (!signed) return NextResponse.json({ error: "Tautan tidak valid." }, { status: 401 });

  const found = await unsubscribe(signed.id);
  return NextResponse.json({ ok: found }, { status: found ? 200 : 404 });
}


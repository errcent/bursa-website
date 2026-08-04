import { Prisma, WaitlistEmailEventType } from "@prisma/client";
import { after, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getResendClient } from "@/lib/email/client";
import { syncWaitlistPreferences } from "@/lib/waitlist/resend";

interface ResendWebhookEvent {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    email?: string;
    to?: string[];
    unsubscribed?: boolean;
    [key: string]: unknown;
  };
}

const EVENT_TYPES: Record<string, WaitlistEmailEventType> = {
  "email.sent": WaitlistEmailEventType.SENT,
  "email.delivered": WaitlistEmailEventType.DELIVERED,
  "email.opened": WaitlistEmailEventType.OPENED,
  "email.clicked": WaitlistEmailEventType.CLICKED,
  "email.bounced": WaitlistEmailEventType.BOUNCED,
  "email.complained": WaitlistEmailEventType.COMPLAINED,
  "email.suppressed": WaitlistEmailEventType.SUPPRESSED,
  "contact.unsubscribed": WaitlistEmailEventType.UNSUBSCRIBED,
};

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  const resend = getResendClient();
  if (!webhookSecret || !resend) {
    return NextResponse.json({ error: "Webhook Resend belum dikonfigurasi." }, { status: 503 });
  }

  const payload = await request.text();
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: "Header signature webhook tidak lengkap." }, { status: 400 });
  }

  let event: ResendWebhookEvent;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret,
    }) as unknown as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Signature webhook tidak valid." }, { status: 401 });
  }

  const eventType =
    EVENT_TYPES[event.type] ??
    (event.type === "contact.updated" && event.data?.unsubscribed
      ? WaitlistEmailEventType.UNSUBSCRIBED
      : null);
  if (!eventType) return NextResponse.json({ ok: true, ignored: true });

  const existing = await db.waitlistEmailEvent.findUnique({
    where: { providerEventId: id },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ ok: true, duplicate: true });

  const email = event.data?.email ?? event.data?.to?.[0];
  const providerMessageId = event.data?.email_id ?? null;
  if (eventType === WaitlistEmailEventType.SENT && providerMessageId) {
    const sentAlreadyLogged = await db.waitlistEmailEvent.findFirst({
      where: { providerMessageId, eventType: WaitlistEmailEventType.SENT },
      select: { id: true },
    });
    if (sentAlreadyLogged) return NextResponse.json({ ok: true, duplicate: true });
  }
  const entry = email
    ? await db.waitlistEntry.findUnique({ where: { email: email.toLowerCase() } })
    : providerMessageId
      ? await db.waitlistEntry.findFirst({
          where: { emailEvents: { some: { providerMessageId } } },
        })
      : null;
  if (!entry) return NextResponse.json({ ok: true, unmatched: true });

  const occurredAt = event.created_at ? new Date(event.created_at) : new Date();
  const suppress =
    eventType === WaitlistEmailEventType.BOUNCED ||
    eventType === WaitlistEmailEventType.COMPLAINED ||
    eventType === WaitlistEmailEventType.SUPPRESSED;
  const unsubscribe = eventType === WaitlistEmailEventType.UNSUBSCRIBED;
  const engaged = eventType === WaitlistEmailEventType.CLICKED;

  try {
    await db.$transaction([
      db.waitlistEmailEvent.create({
        data: {
          waitlistEntryId: entry.id,
          providerEventId: id,
          providerMessageId,
          eventType,
          occurredAt,
          metadata: event as unknown as Prisma.InputJsonValue,
        },
      }),
      db.waitlistEntry.update({
        where: { id: entry.id },
        data: {
          ...(eventType === WaitlistEmailEventType.SENT
            ? { lastMarketingEmailAt: occurredAt }
            : {}),
          ...(engaged
            ? {
                engagedAt: entry.engagedAt ?? occurredAt,
                lifecycleStage: "ENGAGED" as const,
              }
            : {}),
          ...(suppress
            ? {
                status: "SUPPRESSED" as const,
                suppressedAt: occurredAt,
                suppressionReason: event.type,
              }
            : {}),
          ...(unsubscribe
            ? {
                status: "UNSUBSCRIBED" as const,
                unsubscribedAt: occurredAt,
                consentGiven: false,
              }
            : {}),
        },
      }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    throw error;
  }

  if (engaged || suppress || unsubscribe) {
    after(async () => {
      await syncWaitlistPreferences(entry.id);
    });
  }

  return NextResponse.json({ ok: true });
}


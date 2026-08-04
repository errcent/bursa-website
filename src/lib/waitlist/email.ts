import { render } from "@react-email/render";
import { Prisma } from "@prisma/client";

import { lifecycleEmailRegistry } from "@/emails";
import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email/config";
import { getSiteUrl } from "@/lib/email/escape";
import { sendTransactionalEmail } from "@/lib/email/send";
import { getWaitlistMarketingFrom, getWaitlistReplyTo } from "@/lib/waitlist/config";
import {
  getWaitlistPreferencesUrl,
  getWaitlistUnsubscribeUrl,
} from "@/lib/waitlist/preferences";

export function isWaitlistEmailEnabled(): boolean {
  const flag = process.env.WAITLIST_EMAIL_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return isEmailConfigured();
}

export async function sendWaitlistConfirmationEmail(entryId: string): Promise<boolean> {
  if (!isWaitlistEmailEnabled()) return false;

  const entry = await db.waitlistEntry.findUnique({
    where: { id: entryId },
    select: { id: true, email: true, status: true },
  });
  if (!entry || entry.status !== "ACTIVE") return false;

  const siteUrl = getSiteUrl();
  const preferencesUrl = getWaitlistPreferencesUrl(entry.id);
  const unsubscribeUrl = getWaitlistUnsubscribeUrl(entry.id);
  const template = lifecycleEmailRegistry.waitlist_confirmation;
  const props = {
    email: entry.email,
    siteUrl,
    preferencesUrl,
    unsubscribeUrl,
  };
  const html = await render(template.createNode(props));
  const text = template.plainText(props);

  const result = await sendTransactionalEmail({
    category: "waitlist_confirmation",
    to: entry.email,
    from: getWaitlistMarketingFrom(),
    replyTo: getWaitlistReplyTo(),
    subject: template.subject,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    tags: [
      { name: "category", value: "waitlist_confirmation" },
      { name: "entry_id", value: entry.id },
    ],
  });

  if (!result.ok) {
    console.warn("[waitlist] confirmation email failed:", result.error);
    return false;
  }

  if (result.id) {
    try {
      await db.waitlistEmailEvent.create({
        data: {
          waitlistEntryId: entry.id,
          providerEventId: `send:${result.id}`,
          providerMessageId: result.id,
          eventType: "SENT",
          templateKey: "waitlist_confirmation",
          isMarketing: false,
          occurredAt: new Date(),
          metadata: { source: "application" },
        },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
        console.warn("[waitlist] confirmation event log failed:", error);
      }
    }
  }

  return true;
}

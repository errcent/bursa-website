import { getEmailFrom } from "@/lib/email/config";
import { getResendClient } from "@/lib/email/client";
import { type EmailCategory, isEmailCategoryAllowed } from "@/lib/email/policy";

export interface EmailAttachment {
  filename: string;
  content: Buffer;
}

export interface SendEmailInput {
  category: EmailCategory;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendTransactionalEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  if (!isEmailCategoryAllowed(input.category)) {
    console.warn("[email] blocked by policy:", input.category);
    return { ok: false, error: `Kategori email ${input.category} tidak diizinkan.` };
  }

  const resend = getResendClient();
  if (!resend) {
    return { ok: false, error: "Email tidak dikonfigurasi (RESEND_API_KEY kosong)." };
  }

  const { data, error } = await resend.emails.send({
    from: input.from || getEmailFrom(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
    headers: input.headers,
    tags: input.tags,
    attachments: input.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
    })),
  });

  if (error) {
    console.error("[email] send failed:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data?.id };
}

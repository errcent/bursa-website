import { getEmailFrom } from "@/lib/email/config";
import { getResendClient } from "@/lib/email/client";

export interface EmailAttachment {
  filename: string;
  content: Buffer;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
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
  const resend = getResendClient();
  if (!resend) {
    return { ok: false, error: "Email tidak dikonfigurasi (RESEND_API_KEY kosong)." };
  }

  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
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

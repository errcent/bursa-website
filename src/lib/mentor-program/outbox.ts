import { EmailOutboxStatus, EmailOutboxTemplate, type Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email/config";
import { escapeHtml } from "@/lib/email/escape";
import { sendTransactionalEmail } from "@/lib/email/send";

export async function enqueueApplicantEmail(input: {
  applicationId: string;
  to: string;
  template: EmailOutboxTemplate;
  payload: Record<string, unknown>;
}) {
  await db.emailOutbox.create({
    data: {
      applicationId: input.applicationId,
      to: input.to,
      template: input.template,
      payload: input.payload as Prisma.InputJsonValue,
      status: EmailOutboxStatus.PENDING,
    },
  });
}

function renderTemplate(
  template: EmailOutboxTemplate,
  payload: Record<string, unknown>
): { subject: string; html: string; text: string } {
  const name = escapeHtml(String(payload.fullName ?? "kandidat"));
  const url = String(payload.url ?? "");
  const note = String(payload.note ?? "").trim();
  const noteHtml = note ? `<p>${escapeHtml(note)}</p>` : "";
  const noteText = note ? `\n\n${note}` : "";

  switch (template) {
    case EmailOutboxTemplate.APPLICATION_RECEIVED:
      return {
        subject: "Aplikasi mentor Bursanalar sudah kami terima",
        text: `Halo ${String(payload.fullName ?? "")},\n\nTerima kasih. Tim kurasi akan meninjau tahap 1. Jika dilanjutkan, kamu akan menerima tautan tahap 2.\n`,
        html: `<p>Halo ${name},</p><p>Terima kasih. Tim kurasi akan meninjau tahap 1. Jika dilanjutkan, kamu akan menerima tautan tahap 2.</p>`,
      };
    case EmailOutboxTemplate.APPLICATION_L2_INVITATION:
      return {
        subject: "Lanjutkan aplikasi mentor Bursanalar",
        text: `Halo ${String(payload.fullName ?? "")},\n\nAplikasi mentor kamu berlanjut ke tahap 2.\n${url}\nTautan berlaku 21 hari. Kamu bisa menyimpan draf dan lanjut nanti.\n`,
        html: `<p>Halo ${name},</p><p>Aplikasi mentor kamu berlanjut ke tahap 2.</p><p><a href="${escapeHtml(url)}">Lanjutkan aplikasi</a></p><p>Tautan berlaku 21 hari. Kamu bisa menyimpan draf dan lanjut nanti.</p>`,
      };
    case EmailOutboxTemplate.APPLICATION_REJECTED:
      return {
        subject: "Update aplikasi mentor Bursanalar",
        text: `Halo ${String(payload.fullName ?? "")},\n\nSetelah peninjauan, kami belum dapat melanjutkan aplikasi ini.${noteText}\n`,
        html: `<p>Halo ${name},</p><p>Setelah peninjauan, kami belum dapat melanjutkan aplikasi ini.</p>${noteHtml}`,
      };
    case EmailOutboxTemplate.APPLICATION_TALENT_POOL:
      return {
        subject: "Aplikasi mentor Bursanalar — kami simpan untuk nanti",
        text: `Halo ${String(payload.fullName ?? "")},\n\nKami menyimpan profilmu di talent pool dan mungkin menghubungi lagi jika ada kebutuhan yang cocok.${noteText}\n`,
        html: `<p>Halo ${name},</p><p>Kami menyimpan profilmu di talent pool dan mungkin menghubungi lagi jika ada kebutuhan yang cocok.</p>${noteHtml}`,
      };
    case EmailOutboxTemplate.APPLICATION_INFO_REQUIRED:
      return {
        subject: "Informasi tambahan untuk aplikasi mentor Bursanalar",
        text: `Halo ${String(payload.fullName ?? "")},\n\nKami butuh informasi tambahan sebelum meninjau lebih jauh.${noteText}\n`,
        html: `<p>Halo ${name},</p><p>Kami butuh informasi tambahan sebelum meninjau lebih jauh.</p>${noteHtml}`,
      };
    default:
      return { subject: "Bursanalar", text: "", html: "<p></p>" };
  }
}

export async function drainMentorApplicationOutbox(limit = 10) {
  if (!isEmailConfigured()) return { sent: 0, failed: 0 };

  const pending = await db.emailOutbox.findMany({
    where: { status: EmailOutboxStatus.PENDING },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let sent = 0;
  let failed = 0;

  for (const row of pending) {
    const payload = (row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
      ? row.payload
      : {}) as Record<string, unknown>;
    const rendered = renderTemplate(row.template, payload);
    const result = await sendTransactionalEmail({
      category: "mentor_applicant",
      to: row.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: [
        { name: "category", value: "mentor_applicant" },
        { name: "template", value: row.template },
      ],
    });

    if (result.ok) {
      sent += 1;
      await db.emailOutbox.update({
        where: { id: row.id },
        data: {
          status: EmailOutboxStatus.SENT,
          attempts: { increment: 1 },
          sentAt: new Date(),
          lastError: null,
        },
      });
    } else {
      failed += 1;
      await db.emailOutbox.update({
        where: { id: row.id },
        data: {
          status: EmailOutboxStatus.FAILED,
          attempts: { increment: 1 },
          lastError: result.error?.slice(0, 500) ?? "send failed",
        },
      });
    }
  }

  return { sent, failed };
}

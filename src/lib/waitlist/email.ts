import { isEmailConfigured } from "@/lib/email/config";
import { sendTransactionalEmail } from "@/lib/email/send";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function isWaitlistEmailEnabled(): boolean {
  const flag = process.env.WAITLIST_EMAIL_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return isEmailConfigured();
}

export async function sendWaitlistConfirmationEmail(email: string): Promise<void> {
  if (!isWaitlistEmailEnabled()) return;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://bursa-website.vercel.app";
  const safeEmail = escapeHtml(email);

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111;max-width:560px">
      <p style="font-size:18px;font-weight:600;margin:0 0 12px">Kamu masuk waitlist Bursa!</p>
      <p style="margin:0 0 16px">
        Terima kasih sudah bergabung. Kami akan mengabari <strong>${safeEmail}</strong>
        begitu platform edukasi trading kami siap dibuka.
      </p>
      <p style="margin:0 0 16px;color:#444">
        Sementara itu, kamu bisa melihat preview katalog kelas di
        <a href="${escapeHtml(siteUrl)}/katalog">${escapeHtml(siteUrl)}/katalog</a>.
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#666">
        Email ini dikirim karena kamu mendaftar waitlist Bursa. Untuk pertanyaan privasi,
        kunjungi <a href="${escapeHtml(siteUrl)}/privasi">Pusat Privasi</a>.
      </p>
    </div>
  `;

  const text = [
    "Kamu masuk waitlist Bursa!",
    "",
    `Terima kasih sudah bergabung. Kami akan mengabari ${email} begitu platform siap dibuka.`,
    "",
    `Preview katalog: ${siteUrl}/katalog`,
  ].join("\n");

  const result = await sendTransactionalEmail({
    to: email,
    subject: "Konfirmasi waitlist Bursa",
    html,
    text,
  });

  if (!result.ok) {
    console.warn("[waitlist] confirmation email failed:", result.error);
  }
}

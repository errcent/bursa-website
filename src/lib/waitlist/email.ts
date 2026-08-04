import { isEmailConfigured } from "@/lib/email/config";
import { escapeHtml, getSiteUrl } from "@/lib/email/escape";
import { sendTransactionalEmail } from "@/lib/email/send";

export function isWaitlistEmailEnabled(): boolean {
  const flag = process.env.WAITLIST_EMAIL_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return isEmailConfigured();
}

export async function sendWaitlistConfirmationEmail(email: string): Promise<boolean> {
  if (!isWaitlistEmailEnabled()) return false;

  const siteUrl = getSiteUrl();
  const safeEmail = escapeHtml(email);

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111;max-width:560px">
      <p style="font-size:18px;font-weight:600;margin:0 0 12px">Kamu sudah masuk waitlist Bursa</p>
      <p style="margin:0 0 16px">
        Terima kasih — <strong>${safeEmail}</strong> sudah tercatat di waitlist Bursa.
      </p>
      <p style="margin:0 0 16px;color:#444">
        Kami akan mengabari kamu lewat email ini saat ada kabar penting tentang peluncuran Bursa.
        Sementara menunggu, kamu bisa melihat preview katalog di
        <a href="${escapeHtml(siteUrl)}/katalog">${escapeHtml(siteUrl)}/katalog</a>.
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#666">
        Email ini dikirim karena kamu mendaftar waitlist dan menyetujui menerima update dari Bursa.
        Jika kamu tidak merasa mendaftar, abaikan email ini. Pertanyaan privasi:
        <a href="${escapeHtml(siteUrl)}/privasi">Pusat Privasi</a>.
      </p>
    </div>
  `;

  const text = [
    "Kamu sudah masuk waitlist Bursa",
    "",
    `Terima kasih — ${email} sudah tercatat di waitlist Bursa.`,
    "Kami akan mengabari kamu lewat email ini saat ada kabar penting tentang peluncuran Bursa.",
    `Preview katalog: ${siteUrl}/katalog`,
    "",
    "Email ini dikirim karena kamu mendaftar waitlist dan menyetujui menerima update dari Bursa.",
    "Jika kamu tidak merasa mendaftar, abaikan email ini.",
  ].join("\n");

  const result = await sendTransactionalEmail({
    to: email,
    subject: "Kamu sudah masuk waitlist Bursa",
    html,
    text,
  });

  if (!result.ok) {
    console.warn("[waitlist] confirmation email failed:", result.error);
    return false;
  }

  return true;
}

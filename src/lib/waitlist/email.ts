import { isEmailConfigured } from "@/lib/email/config";
import { escapeHtml, getSiteUrl } from "@/lib/email/escape";
import { sendTransactionalEmail } from "@/lib/email/send";
import { WAITLIST_VERIFY_TTL_MS } from "@/lib/waitlist/verification";

export function isWaitlistEmailEnabled(): boolean {
  const flag = process.env.WAITLIST_EMAIL_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return isEmailConfigured();
}

export async function sendWaitlistVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  if (!isWaitlistEmailEnabled()) return;

  const siteUrl = getSiteUrl();
  const verifyUrl = `${siteUrl}/waitlist/verifikasi?token=${encodeURIComponent(token)}`;
  const safeEmail = escapeHtml(email);
  const hours = Math.round(WAITLIST_VERIFY_TTL_MS / (60 * 60 * 1000));

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111;max-width:560px">
      <p style="font-size:18px;font-weight:600;margin:0 0 12px">Verifikasi email waitlist Bursa</p>
      <p style="margin:0 0 16px">
        Terima kasih sudah mendaftar waitlist. Klik tombol di bawah untuk mengonfirmasi bahwa
        <strong>${safeEmail}</strong> adalah email kamu.
      </p>
      <p style="margin:0 0 20px">
        <a href="${escapeHtml(verifyUrl)}"
           style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">
          Verifikasi email
        </a>
      </p>
      <p style="margin:0 0 16px;color:#444;font-size:14px">
        Tautan berlaku ${hours} jam. Jika tombol tidak berfungsi, salin URL ini ke browser:<br/>
        <span style="word-break:break-all">${escapeHtml(verifyUrl)}</span>
      </p>
      <p style="margin:0 0 16px;color:#444">
        Setelah terverifikasi, kami akan mengabari kamu begitu platform edukasi trading Bursa siap dibuka.
        Sementara itu, lihat preview katalog di
        <a href="${escapeHtml(siteUrl)}/katalog">${escapeHtml(siteUrl)}/katalog</a>.
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#666">
        Email ini dikirim karena kamu mendaftar waitlist Bursa. Pertanyaan privasi:
        <a href="${escapeHtml(siteUrl)}/privasi">Pusat Privasi</a>.
      </p>
    </div>
  `;

  const text = [
    "Verifikasi email waitlist Bursa",
    "",
    `Terima kasih sudah mendaftar. Buka tautan berikut untuk mengonfirmasi ${email}:`,
    verifyUrl,
    "",
    `Tautan berlaku ${hours} jam.`,
    `Preview katalog: ${siteUrl}/katalog`,
  ].join("\n");

  const result = await sendTransactionalEmail({
    to: email,
    subject: "Verifikasi email waitlist Bursa",
    html,
    text,
  });

  if (!result.ok) {
    console.warn("[waitlist] verification email failed:", result.error);
  }
}

/** @deprecated Pass verification token explicitly via sendWaitlistVerificationEmail. */
export async function sendWaitlistConfirmationEmail(email: string): Promise<void> {
  console.warn("[waitlist] sendWaitlistConfirmationEmail called without token — email skipped.");
  void email;
}

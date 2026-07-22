import { isEmailConfigured } from "@/lib/email/config";
import { escapeHtml, getSiteUrl } from "@/lib/email/escape";
import { sendTransactionalEmail } from "@/lib/email/send";

export function isAuthEmailEnabled(): boolean {
  const flag = process.env.AUTH_EMAIL_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return isEmailConfigured();
}

export async function sendWelcomeEmail(input: {
  email: string;
  name: string;
}): Promise<void> {
  if (!isAuthEmailEnabled()) return;

  const siteUrl = getSiteUrl();
  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111;max-width:560px">
      <p style="font-size:18px;font-weight:600;margin:0 0 12px">Selamat datang di Bursa, ${safeName}!</p>
      <p style="margin:0 0 16px">
        Akun kamu (<strong>${safeEmail}</strong>) berhasil dibuat dengan Google.
        Email ini sudah terverifikasi melalui Google.
      </p>
      <p style="margin:0 0 20px">
        <a href="${escapeHtml(siteUrl)}/katalog"
           style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">
          Jelajahi katalog
        </a>
      </p>
      <p style="margin:0 0 16px;color:#444">
        Kami akan mengabari kamu tentang fitur baru dan peluncuran penuh platform.
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#666">
        Bukan kamu yang mendaftar? Hubungi support@bursanalar.com atau kunjungi
        <a href="${escapeHtml(siteUrl)}/privasi">Pusat Privasi</a>.
      </p>
    </div>
  `;

  const text = [
    `Selamat datang di Bursa, ${input.name}!`,
    "",
    `Akun ${input.email} berhasil dibuat dengan Google.`,
    "",
    `Jelajahi katalog: ${siteUrl}/katalog`,
  ].join("\n");

  const result = await sendTransactionalEmail({
    to: input.email,
    subject: "Selamat datang di Bursa",
    html,
    text,
  });

  if (!result.ok) {
    console.warn("[auth] welcome email failed:", result.error);
  }
}

export async function sendAccountVerificationEmail(input: {
  email: string;
  name: string;
  token: string;
}): Promise<void> {
  if (!isAuthEmailEnabled()) return;

  const siteUrl = getSiteUrl();
  const verifyUrl = `${siteUrl}/verifikasi-email?token=${encodeURIComponent(input.token)}`;
  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111;max-width:560px">
      <p style="font-size:18px;font-weight:600;margin:0 0 12px">Verifikasi email akun Bursa</p>
      <p style="margin:0 0 16px">
        Hai ${safeName}, klik tombol di bawah untuk memverifikasi
        <strong>${safeEmail}</strong>.
      </p>
      <p style="margin:0 0 20px">
        <a href="${escapeHtml(verifyUrl)}"
           style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">
          Verifikasi email
        </a>
      </p>
      <p style="margin:0 0 16px;color:#444;font-size:14px">
        Tautan berlaku 24 jam. Jika tombol tidak berfungsi:<br/>
        <span style="word-break:break-all">${escapeHtml(verifyUrl)}</span>
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#666">
        Bukan kamu? Abaikan email ini atau hubungi support@bursanalar.com.
      </p>
    </div>
  `;

  const text = [
    "Verifikasi email akun Bursa",
    "",
    `Hai ${input.name}, buka tautan berikut untuk memverifikasi ${input.email}:`,
    verifyUrl,
  ].join("\n");

  const result = await sendTransactionalEmail({
    to: input.email,
    subject: "Verifikasi email akun Bursa",
    html,
    text,
  });

  if (!result.ok) {
    console.warn("[auth] verification email failed:", result.error);
  }
}

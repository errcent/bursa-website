import { isEmailConfigured } from "@/lib/email/config";
import { escapeHtml, getSiteUrl } from "@/lib/email/escape";
import { sendTransactionalEmail } from "@/lib/email/send";

export function isAuthEmailEnabled(): boolean {
  const flag = process.env.AUTH_EMAIL_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return isEmailConfigured();
}

export function isAuthWelcomeEmailEnabled(): boolean {
  const flag = process.env.AUTH_WELCOME_EMAIL_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return isAuthEmailEnabled();
}

export async function sendWelcomeEmail(input: {
  email: string;
  name: string;
}): Promise<void> {
  if (!isAuthWelcomeEmailEnabled()) return;

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
    category: "auth_welcome",
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
    category: "auth_verification",
    to: input.email,
    subject: "Verifikasi email akun Bursa",
    html,
    text,
  });

  if (!result.ok) {
    console.warn("[auth] verification email failed:", result.error);
  }
}

export async function sendPasswordResetEmail(input: {
  email: string;
  name: string;
  token: string;
}): Promise<void> {
  if (!isAuthEmailEnabled()) return;

  const siteUrl = getSiteUrl();
  const resetUrl = `${siteUrl}/lupa-password/reset?token=${encodeURIComponent(input.token)}`;
  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111;max-width:560px">
      <p style="font-size:18px;font-weight:600;margin:0 0 12px">Reset kata sandi Bursa</p>
      <p style="margin:0 0 16px">
        Hai ${safeName}, kami menerima permintaan reset kata sandi untuk
        <strong>${safeEmail}</strong>.
      </p>
      <p style="margin:0 0 20px">
        <a href="${escapeHtml(resetUrl)}"
           style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">
          Atur ulang kata sandi
        </a>
      </p>
      <p style="margin:0 0 16px;color:#444;font-size:14px">
        Tautan berlaku 30 menit. Jika tombol tidak berfungsi:<br/>
        <span style="word-break:break-all">${escapeHtml(resetUrl)}</span>
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#666">
        Bukan kamu? Abaikan email ini. Kata sandi tidak akan berubah.
      </p>
    </div>
  `;

  const text = [
    "Reset kata sandi Bursa",
    "",
    `Hai ${input.name}, buka tautan berikut untuk mengatur ulang kata sandi ${input.email}:`,
    resetUrl,
    "",
    "Tautan berlaku 30 menit.",
  ].join("\n");

  const result = await sendTransactionalEmail({
    category: "auth_password_reset",
    to: input.email,
    subject: "Reset kata sandi akun Bursa",
    html,
    text,
  });

  if (!result.ok) {
    console.warn("[auth] password reset email failed:", result.error);
  }
}

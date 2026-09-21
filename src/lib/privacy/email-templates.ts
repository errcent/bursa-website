import { privacyPublicUrl } from "@/lib/hosts/hosts";
import type { LegalLocale } from "@/lib/hosts/hosts";
import { escapeHtml } from "@/lib/email/escape";

export function dsarConfirmationEmail(
  locale: LegalLocale,
  input: { fullName: string; referenceCode: string }
): { subject: string; html: string; text: string } {
  const statusUrl = privacyPublicUrl("permintaan-status", locale);
  const safeName = escapeHtml(input.fullName);
  const safeRef = escapeHtml(input.referenceCode);
  if (locale === "en") {
    return {
      subject: `Privacy request received - ${input.referenceCode}`,
      html: `<p>Hi ${safeName},</p>
<p>We received your data-subject request. Reference: <strong>${safeRef}</strong>.</p>
<p>We will respond within 14 business days. Track status: <a href="${statusUrl}">${statusUrl}</a></p>
<p> -  Bursa Privacy Team</p>`,
      text: `Hi ${input.fullName},\n\nWe received your request. Reference: ${input.referenceCode}.\nTrack: ${statusUrl}\n\n -  Bursa Privacy Team`,
    };
  }
  return {
    subject: `Permintaan privasi diterima - ${input.referenceCode}`,
    html: `<p>Halo ${safeName},</p>
<p>Kami menerima permintaan hak subjek datamu. Nomor referensi: <strong>${safeRef}</strong>.</p>
<p>Kami akan merespons paling lambat 14 hari kerja. Lacak status: <a href="${statusUrl}">${statusUrl}</a></p>
<p> -  Tim Privasi Bursa</p>`,
    text: `Halo ${input.fullName},\n\nPermintaan diterima. Referensi: ${input.referenceCode}.\nLacak: ${statusUrl}\n\n -  Tim Privasi Bursa`,
  };
}

export function dsarOtpEmail(
  locale: LegalLocale,
  input: { otp: string; referenceCode: string }
): { subject: string; html: string; text: string } {
  const safeRef = escapeHtml(input.referenceCode);
  const safeOtp = escapeHtml(input.otp);
  if (locale === "en") {
    return {
      subject: "Your privacy request verification code",
      html: `<p>Your verification code for request <strong>${safeRef}</strong>: <strong>${safeOtp}</strong></p><p>Valid for 15 minutes.</p>`,
      text: `Code for ${input.referenceCode}: ${input.otp}. Valid 15 minutes.`,
    };
  }
  return {
    subject: "Kode verifikasi permintaan privasi",
    html: `<p>Kode verifikasi untuk permintaan <strong>${safeRef}</strong>: <strong>${safeOtp}</strong></p><p>Berlaku 15 menit.</p>`,
    text: `Kode untuk ${input.referenceCode}: ${input.otp}. Berlaku 15 menit.`,
  };
}

export function dsarStatusUpdateEmail(
  locale: LegalLocale,
  input: { fullName: string; referenceCode: string; status: string }
): { subject: string; html: string; text: string } {
  const statusUrl = privacyPublicUrl("permintaan-status", locale);
  const safeName = escapeHtml(input.fullName);
  const safeRef = escapeHtml(input.referenceCode);
  const safeStatus = escapeHtml(input.status);
  if (locale === "en") {
    return {
      subject: `Privacy request update - ${input.referenceCode}`,
      html: `<p>Hi ${safeName},</p><p>Request <strong>${safeRef}</strong> is now: <strong>${safeStatus}</strong>.</p><p><a href="${statusUrl}">View details</a></p>`,
      text: `Request ${input.referenceCode} status: ${input.status}. ${statusUrl}`,
    };
  }
  return {
    subject: `Update permintaan privasi - ${input.referenceCode}`,
    html: `<p>Halo ${safeName},</p><p>Permintaan <strong>${safeRef}</strong> sekarang: <strong>${safeStatus}</strong>.</p><p><a href="${statusUrl}">Lihat detail</a></p>`,
    text: `Permintaan ${input.referenceCode}: ${input.status}. ${statusUrl}`,
  };
}

import { jsPDF } from "jspdf";

import {
  getMentorApplicationAdminEmail,
  isMentorApplicationEmailEnabled,
} from "@/lib/email/config";
import { sendTransactionalEmail } from "@/lib/email/send";
import type { MentorApplication } from "@/lib/mentor-program/applications";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatRupiah(amount?: number): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

function multilineHtml(value: string): string {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

interface ApplicationField {
  label: string;
  value: string;
  fullWidth?: boolean;
}

function formatDocuments(application: MentorApplication): string {
  const lines: string[] = [];
  if (application.cvDocument) {
    lines.push(`CV: ${application.cvDocument.fileName} (${application.cvDocument.url})`);
  }
  if (application.certificateDocument) {
    lines.push(
      `Sertifikat: ${application.certificateDocument.fileName} (${application.certificateDocument.url})`
    );
  }
  if (lines.length === 0) return "Tidak ada dokumen terunggah.";
  return lines.join("\n");
}

function buildApplicationFields(application: MentorApplication): ApplicationField[] {
  return [
    { label: "ID Aplikasi", value: application.id },
    { label: "Status", value: application.status },
    { label: "Dikirim", value: formatDateTime(application.createdAt) },
    { label: "Nama Lengkap", value: application.fullName },
    { label: "Email", value: application.email },
    { label: "Telepon / WhatsApp", value: application.phone },
    { label: "Judul Profesional", value: application.professionalTitle },
    { label: "Instrumen", value: application.instruments.join(", ") },
    { label: "Tahun Pengalaman", value: String(application.yearsExperience) },
    { label: "Sertifikasi / Lisensi", value: application.licenseLabel || "—" },
    { label: "Link Portofolio", value: application.portfolioUrl || "—" },
    {
      label: "Estimasi Harga Kelas",
      value: formatRupiah(application.estimatedCoursePrice),
    },
    {
      label: "Sudah Punya Konten Edukasi",
      value: application.hasExistingContent ? "Ya" : "Tidak",
    },
    {
      label: "Setuju Syarat & Ketentuan",
      value: application.agreedToTerms ? "Ya" : "Tidak",
    },
    { label: "Bio & Pengalaman Mengajar", value: application.bio, fullWidth: true },
    { label: "Filosofi Trading", value: application.philosophy, fullWidth: true },
    {
      label: "Dokumen Terunggah",
      value: formatDocuments(application),
      fullWidth: true,
    },
  ];
}

function renderFieldCell(field: ApplicationField): string {
  const cellStyle =
    ' style="padding:12px 16px;border-bottom:1px solid #e8e6f0;vertical-align:top;width:50%;"';

  return `
    <td${cellStyle}>
      <div style="font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#6b6f8a;margin-bottom:6px;">
        ${escapeHtml(field.label)}
      </div>
      <div style="font-size:14px;line-height:1.5;color:#1f2133;white-space:pre-wrap;">
        ${multilineHtml(field.value)}
      </div>
    </td>`;
}

function buildHtmlEmail(application: MentorApplication): string {
  const fields = buildApplicationFields(application);
  const rows: string[] = [];

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    if (field.fullWidth) {
      rows.push(`
        <tr>
          <td colspan="2" style="padding:12px 16px;border-bottom:1px solid #e8e6f0;vertical-align:top;">
            <div style="font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#6b6f8a;margin-bottom:6px;">
              ${escapeHtml(field.label)}
            </div>
            <div style="font-size:14px;line-height:1.6;color:#1f2133;white-space:pre-wrap;">
              ${multilineHtml(field.value)}
            </div>
          </td>
        </tr>`);
      continue;
    }

    const next = fields[i + 1];
    if (next && !next.fullWidth) {
      rows.push(`<tr>${renderFieldCell(field)}${renderFieldCell(next)}</tr>`);
      i += 1;
    } else {
      rows.push(`<tr>${renderFieldCell(field)}<td style="padding:12px 16px;border-bottom:1px solid #e8e6f0;"></td></tr>`);
    }
  }

  const rowsHtml = rows.join("");

  return `<!DOCTYPE html>
<html lang="id">
  <body style="margin:0;padding:24px;background:#f4f3f8;font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2133;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;">
      <tr>
        <td style="background:linear-gradient(135deg,#5b5bd6 0%,#7c6cf0 100%);border-radius:16px 16px 0 0;padding:28px 32px;">
          <div style="font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.82);">
            Bursa · Program Mentor
          </div>
          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;color:#ffffff;">
            Aplikasi Mentor Baru
          </h1>
          <p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:rgba(255,255,255,0.9);">
            ${escapeHtml(application.fullName)} · ${escapeHtml(application.professionalTitle)}
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#ffffff;border:1px solid #e8e6f0;border-top:none;border-radius:0 0 16px 16px;padding:8px 0 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            ${rowsHtml}
          </table>
          <div style="padding:16px 24px 8px;font-size:12px;line-height:1.6;color:#6b6f8a;">
            Balas email ini untuk menghubungi pelamar langsung di
            <a href="mailto:${escapeHtml(application.email)}" style="color:#5b5bd6;">${escapeHtml(application.email)}</a>.
            Lampiran PDF berisi ringkasan yang sama.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildPlainTextEmail(application: MentorApplication): string {
  const fields = buildApplicationFields(application);
  const lines = fields.map((field) => `${field.label}: ${field.value}`);
  return [
    "Aplikasi Mentor Baru — Bursa",
    "",
    ...lines,
    "",
    `Balas ke pelamar: ${application.email}`,
  ].join("\n");
}

function wrapPdfText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function buildApplicationPdfBuffer(application: MentorApplication): Buffer {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeBlock = (label: string, value: string, opts?: { heading?: boolean }) => {
    const labelSize = opts?.heading ? 14 : 10;
    const valueSize = opts?.heading ? 0 : 11;
    const labelLines = wrapPdfText(doc, label, maxWidth);
    const valueLines = valueSize > 0 ? wrapPdfText(doc, value, maxWidth) : [];

    doc.setFont("helvetica", opts?.heading ? "bold" : "bold");
    doc.setFontSize(labelSize);
    doc.setTextColor(opts?.heading ? 60 : 90, opts?.heading ? 60 : 90, opts?.heading ? 120 : 130);

    for (const line of labelLines) {
      ensureSpace(labelSize * 1.4);
      doc.text(line, margin, y);
      y += labelSize * 1.35;
    }

    if (valueSize > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(valueSize);
      doc.setTextColor(30, 31, 38);
      for (const line of valueLines) {
        ensureSpace(valueSize * 1.4);
        doc.text(line, margin, y);
        y += valueSize * 1.35;
      }
    }

    y += opts?.heading ? 10 : 8;
  };

  writeBlock("Aplikasi Mentor Baru", application.fullName, { heading: true });
  writeBlock("Ringkasan", `${application.professionalTitle} · ${application.email}`);

  for (const field of buildApplicationFields(application)) {
    writeBlock(field.label, field.value);
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

export async function notifyAdminOfMentorApplication(
  application: MentorApplication
): Promise<{ sent: boolean; error?: string }> {
  if (!isMentorApplicationEmailEnabled()) {
    console.warn(
      "[mentor-application] Email not sent — RESEND_API_KEY missing or MENTOR_APPLICATION_EMAIL_ENABLED=false."
    );
    return { sent: false, error: "Email tidak dikonfigurasi." };
  }

  const adminEmail = getMentorApplicationAdminEmail();
  const pdfFilename = `aplikasi-mentor-${application.id}.pdf`;
  const subject = `[Bursa] Aplikasi Mentor Baru — ${application.fullName}`;

  const result = await sendTransactionalEmail({
    to: adminEmail,
    subject,
    html: buildHtmlEmail(application),
    text: buildPlainTextEmail(application),
    replyTo: application.email,
    attachments: [
      {
        filename: pdfFilename,
        content: buildApplicationPdfBuffer(application),
      },
    ],
  });

  if (!result.ok) {
    console.error("[mentor-application] Admin notification failed:", result.error);
    return { sent: false, error: result.error };
  }

  return { sent: true };
}

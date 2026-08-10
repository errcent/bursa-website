import type { CSSProperties, ReactNode } from "react";

import { emailHeaderUrl } from "@/lib/site-metadata";

export interface BrandedEmailLayoutProps {
  previewText: string;
  email: string;
  siteUrl: string;
  preferencesUrl: string;
  unsubscribeUrl: string;
  referralUrl?: string;
  ctaLabel: string;
  ctaUrl: string;
  /** Light body uses light header bake; dark variant for dark templates. */
  headerVariant?: "light" | "dark";
  children: ReactNode;
}

const colors = {
  background: "#f3f0e8",
  surface: "#ffffff",
  ink: "#1a1a1a",
  muted: "#737373",
  border: "#e5e5e5",
  brand: "#000000",
  accent: "#9496c0",
} as const;

const bodyStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  width: "100%",
  backgroundColor: colors.background,
  color: colors.ink,
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
};

const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: colors.surface,
};

const contentStyle: CSSProperties = {
  padding: "36px 32px 24px",
  fontSize: "16px",
  lineHeight: "1.65",
};

const linkStyle: CSSProperties = {
  color: colors.ink,
  textDecoration: "underline",
};

export function BrandedEmailLayout({
  previewText,
  email,
  siteUrl,
  preferencesUrl,
  unsubscribeUrl,
  referralUrl,
  ctaLabel,
  ctaUrl,
  headerVariant = "light",
  children,
}: BrandedEmailLayoutProps) {
  const headerSrc = emailHeaderUrl(headerVariant);

  return (
    <html lang="id">
      {/* Email documents require a native head; this is not a Next.js page. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{previewText}</title>
      </head>
      <body style={bodyStyle}>
        <div
          aria-hidden="true"
          style={{
            display: "none",
            maxHeight: 0,
            overflow: "hidden",
            opacity: 0,
            color: "transparent",
          }}
        >
          {previewText}
        </div>
        <table
          role="presentation"
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={{ width: "100%", backgroundColor: colors.background }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: "24px 12px" }}>
                <table
                  role="presentation"
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={containerStyle}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: 0, lineHeight: 0 }}>
                        <a href={siteUrl} aria-label="Kunjungi Bursa">
                          <img
                            src={headerSrc}
                            width={480}
                            height={120}
                            alt="bursanalar."
                            style={{
                              display: "block",
                              width: "100%",
                              maxWidth: "480px",
                              height: "auto",
                              border: 0,
                            }}
                          />
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style={contentStyle}>
                        <main>{children}</main>
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={{ width: "100%", margin: "28px 0 8px" }}
                        >
                          <tbody>
                            <tr>
                              <td align="center">
                                <a
                                  href={ctaUrl}
                                  aria-label={ctaLabel}
                                  style={{
                                    display: "inline-block",
                                    padding: "13px 22px",
                                    borderRadius: "10px",
                                    backgroundColor: colors.brand,
                                    color: "#f5f5f5",
                                    fontSize: "16px",
                                    fontWeight: 700,
                                    lineHeight: "1.25",
                                    textDecoration: "none",
                                  }}
                                >
                                  {ctaLabel}
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: "24px 32px 30px",
                          borderTop: `1px solid ${colors.border}`,
                          color: colors.muted,
                          fontSize: "13px",
                          lineHeight: "1.6",
                        }}
                      >
                        <p style={{ margin: "0 0 10px" }}>
                          Anda menerima email ini karena mendaftar pembaruan edukasi Bursa
                          dengan alamat {email}.
                        </p>
                        <p style={{ margin: "0 0 10px" }}>
                          Kami menjaga privasi Anda dan hanya menggunakan data kontak untuk
                          komunikasi yang Anda pilih.
                        </p>
                        <p style={{ margin: "0 0 10px" }}>
                          <a href={preferencesUrl} style={linkStyle}>
                            Atur topik dan frekuensi email
                          </a>
                          {" · "}
                          <a href={unsubscribeUrl} style={linkStyle}>
                            Berhenti menerima email Bursa
                          </a>
                        </p>
                        {referralUrl ? (
                          <p style={{ margin: "0 0 10px" }}>
                            <a href={referralUrl} style={linkStyle}>
                              Bagikan halaman pendaftaran Bursa
                            </a>
                          </p>
                        ) : null}
                        <p style={{ margin: 0 }}>
                          Perlu bantuan? Balas email ini atau hubungi support@bursanalar.com.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export interface PlainTextFooterProps {
  email: string;
  preferencesUrl: string;
  unsubscribeUrl: string;
  referralUrl?: string;
}

export function plainTextFooter({
  email,
  preferencesUrl,
  unsubscribeUrl,
  referralUrl,
}: PlainTextFooterProps): string {
  return [
    "---",
    `Email ini dikirim karena Anda mendaftar pembaruan edukasi Bursa dengan alamat ${email}.`,
    "Privasi: data kontak Anda hanya digunakan untuk komunikasi yang Anda pilih.",
    `Atur topik dan frekuensi email: ${preferencesUrl}`,
    `Berhenti menerima email Bursa: ${unsubscribeUrl}`,
    referralUrl ? `Bagikan halaman pendaftaran Bursa: ${referralUrl}` : null,
    "Perlu bantuan? Balas email ini atau hubungi support@bursanalar.com.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export const emailTextStyles = {
  heading: {
    margin: "0 0 16px",
    color: colors.ink,
    fontSize: "28px",
    lineHeight: "1.25",
  } satisfies CSSProperties,
  paragraph: {
    margin: "0 0 16px",
  } satisfies CSSProperties,
  list: {
    margin: "0 0 18px",
    paddingLeft: "22px",
  } satisfies CSSProperties,
  muted: colors.muted,
} as const;

export function authEmailHeaderHtml(variant: "light" | "dark" = "light"): string {
  const src = emailHeaderUrl(variant);
  return `
    <p style="margin:0 0 24px;line-height:0">
      <img src="${src}" width="480" height="120" alt="bursanalar."
           style="display:block;width:100%;max-width:480px;height:auto;border:0" />
    </p>
  `;
}

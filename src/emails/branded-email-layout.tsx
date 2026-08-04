import type { CSSProperties, ReactNode } from "react";

export interface BrandedEmailLayoutProps {
  previewText: string;
  email: string;
  siteUrl: string;
  preferencesUrl: string;
  unsubscribeUrl: string;
  referralUrl?: string;
  ctaLabel: string;
  ctaUrl: string;
  children: ReactNode;
}

const colors = {
  background: "#f3f0e8",
  surface: "#ffffff",
  ink: "#17251f",
  muted: "#5f6c66",
  border: "#dce2dc",
  brand: "#124c38",
  accent: "#d8a943",
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
  color: colors.brand,
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
  children,
}: BrandedEmailLayoutProps) {
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
                      <td
                        style={{
                          padding: "26px 32px",
                          backgroundColor: colors.brand,
                          borderBottom: `4px solid ${colors.accent}`,
                        }}
                      >
                        <a
                          href={siteUrl}
                          aria-label="Kunjungi situs Bursa Nalar"
                          style={{
                            color: "#ffffff",
                            fontSize: "24px",
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                            textDecoration: "none",
                          }}
                        >
                          Bursa Nalar
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
                                    borderRadius: "6px",
                                    backgroundColor: colors.brand,
                                    color: "#ffffff",
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
                          Anda menerima email ini karena mendaftar pembaruan
                          edukasi Bursa Nalar dengan alamat {email}.
                        </p>
                        <p style={{ margin: "0 0 10px" }}>
                          Kami menjaga privasi Anda dan hanya menggunakan data
                          kontak untuk komunikasi yang Anda pilih.
                        </p>
                        <p style={{ margin: "0 0 10px" }}>
                          <a href={preferencesUrl} style={linkStyle}>
                            Atur topik dan frekuensi email
                          </a>
                          {" · "}
                          <a href={unsubscribeUrl} style={linkStyle}>
                            Berhenti menerima email Bursa Nalar
                          </a>
                        </p>
                        {referralUrl ? (
                          <p style={{ margin: "0 0 10px" }}>
                            <a href={referralUrl} style={linkStyle}>
                              Bagikan halaman pendaftaran Bursa Nalar
                            </a>
                          </p>
                        ) : null}
                        <p style={{ margin: 0 }}>
                          Perlu bantuan? Balas email ini atau hubungi tim
                          dukungan Bursa Nalar.
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
    `Email ini dikirim karena Anda mendaftar pembaruan edukasi Bursa Nalar dengan alamat ${email}.`,
    "Privasi: data kontak Anda hanya digunakan untuk komunikasi yang Anda pilih.",
    `Atur topik dan frekuensi email: ${preferencesUrl}`,
    `Berhenti menerima email Bursa Nalar: ${unsubscribeUrl}`,
    referralUrl
      ? `Bagikan halaman pendaftaran Bursa Nalar: ${referralUrl}`
      : null,
    "Perlu bantuan? Balas email ini atau hubungi tim dukungan Bursa Nalar.",
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

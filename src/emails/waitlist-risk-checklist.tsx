import {
  BrandedEmailLayout,
  emailTextStyles,
  plainTextFooter,
} from "./branded-email-layout";

export const WAITLIST_RISK_CHECKLIST_SUBJECT =
  "Checklist risiko sebelum mengambil keputusan finansial";
export const WAITLIST_RISK_CHECKLIST_PREVIEW =
  "Lima pertanyaan sederhana untuk membantu pemula menilai risiko dengan lebih terstruktur.";

export interface WaitlistRiskChecklistProps {
  email: string;
  siteUrl: string;
  preferencesUrl: string;
  unsubscribeUrl: string;
  referralUrl?: string;
  lessonUrl: string;
}

const checklist = [
  "Apakah saya memahami cara kerja produk atau keputusan ini?",
  "Berapa kerugian yang masih sanggup saya tanggung tanpa mengganggu kebutuhan utama?",
  "Apakah dana darurat dan kewajiban jangka dekat sudah diperhitungkan?",
  "Apakah keputusan ini sesuai dengan tujuan dan jangka waktu saya?",
  "Informasi apa yang belum saya periksa, termasuk biaya dan potensi konflik kepentingan?",
] as const;

export function WaitlistRiskChecklistEmail(
  props: WaitlistRiskChecklistProps,
) {
  return (
    <BrandedEmailLayout
      {...props}
      previewText={WAITLIST_RISK_CHECKLIST_PREVIEW}
      ctaLabel="Pelajari checklist risiko lengkap"
      ctaUrl={props.lessonUrl}
    >
      <h1 style={emailTextStyles.heading}>
        Lima pertanyaan sebelum mengambil keputusan
      </h1>
      <p style={emailTextStyles.paragraph}>Halo,</p>
      <p style={emailTextStyles.paragraph}>
        Mengelola risiko bukan berarti menghindari semua ketidakpastian. Bagi
        pemula, langkah awal yang berguna adalah memperlambat keputusan dan
        memeriksa hal-hal mendasar.
      </p>
      <ol style={emailTextStyles.list}>
        {checklist.map((item) => (
          <li key={item} style={{ marginBottom: "9px" }}>
            {item}
          </li>
        ))}
      </ol>
      <p style={emailTextStyles.paragraph}>
        Checklist ini adalah materi edukasi umum, bukan nasihat keuangan atau
        rekomendasi untuk membeli maupun menjual produk tertentu. Tidak ada
        keputusan yang bebas risiko atau hasil yang dapat dijamin.
      </p>
    </BrandedEmailLayout>
  );
}

export function waitlistRiskChecklistPlainText(
  props: WaitlistRiskChecklistProps,
): string {
  return [
    "Lima pertanyaan sebelum mengambil keputusan",
    "",
    "Mengelola risiko bukan berarti menghindari semua ketidakpastian. Bagi pemula, langkah awal yang berguna adalah memperlambat keputusan dan memeriksa hal-hal mendasar.",
    "",
    ...checklist.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Checklist ini adalah materi edukasi umum, bukan nasihat keuangan atau rekomendasi untuk membeli maupun menjual produk tertentu. Tidak ada keputusan yang bebas risiko atau hasil yang dapat dijamin.",
    "",
    `Pelajari checklist risiko lengkap: ${props.lessonUrl}`,
    "",
    plainTextFooter(props),
  ].join("\n");
}

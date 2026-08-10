import {
  BrandedEmailLayout,
  emailTextStyles,
  plainTextFooter,
} from "./branded-email-layout";

export const WAITLIST_PRODUCT_PREVIEW_SUBJECT =
  "Pratinjau Bursa: belajar sebelum memilih";
export const WAITLIST_PRODUCT_PREVIEW_PREVIEW =
  "Lihat arah produk kami dan bantu tentukan materi edukasi yang paling berguna.";

export interface WaitlistProductPreviewProps {
  email: string;
  siteUrl: string;
  preferencesUrl: string;
  unsubscribeUrl: string;
  referralUrl?: string;
  surveyUrl: string;
}

export function WaitlistProductPreviewEmail(
  props: WaitlistProductPreviewProps,
) {
  return (
    <BrandedEmailLayout
      {...props}
      previewText={WAITLIST_PRODUCT_PREVIEW_PREVIEW}
      ctaLabel="Jawab satu pertanyaan"
      ctaUrl={props.surveyUrl}
    >
      <h1 style={emailTextStyles.heading}>Belajar sebelum memilih</h1>
      <p style={emailTextStyles.paragraph}>Halo,</p>
      <p style={emailTextStyles.paragraph}>
        Bursa sedang dibangun sebagai ruang belajar yang membantu
        pengguna memahami istilah, membandingkan pertimbangan, dan mengenali
        risiko sebelum mengambil keputusan.
      </p>
      <p style={emailTextStyles.paragraph}>
        Pratinjau awal kami menempatkan konteks edukasi di depan: penjelasan
        singkat, pertanyaan pemeriksaan, serta jalur belajar yang bisa dipilih
        sesuai kebutuhan. Bursa tidak menjanjikan keuntungan dan tidak
        menggantikan nasihat profesional yang mempertimbangkan situasi pribadi.
      </p>
      <p style={emailTextStyles.paragraph}>
        Satu pertanyaan dari kami: materi mana yang ingin Anda pelajari lebih
        dulu? Jawaban Anda membantu kami menentukan urutan materi berikutnya.
      </p>
    </BrandedEmailLayout>
  );
}

export function waitlistProductPreviewPlainText(
  props: WaitlistProductPreviewProps,
): string {
  return [
    "Belajar sebelum memilih",
    "",
    "Bursa sedang dibangun sebagai ruang belajar yang membantu pengguna memahami istilah, membandingkan pertimbangan, dan mengenali risiko sebelum mengambil keputusan.",
    "",
    "Pratinjau awal kami menempatkan konteks edukasi di depan: penjelasan singkat, pertanyaan pemeriksaan, serta jalur belajar yang bisa dipilih sesuai kebutuhan. Bursa tidak menjanjikan keuntungan dan tidak menggantikan nasihat profesional yang mempertimbangkan situasi pribadi.",
    "",
    "Satu pertanyaan dari kami: materi mana yang ingin Anda pelajari lebih dulu? Jawaban Anda membantu kami menentukan urutan materi berikutnya.",
    "",
    `Jawab satu pertanyaan: ${props.surveyUrl}`,
    "",
    plainTextFooter(props),
  ].join("\n");
}

import {
  BrandedEmailLayout,
  emailTextStyles,
  plainTextFooter,
} from "./branded-email-layout";

export const WAITLIST_FOUNDER_STORY_SUBJECT =
  "Mengapa Bursa dimulai dari pendidikan";
export const WAITLIST_FOUNDER_STORY_PREVIEW =
  "Cerita singkat di balik Bursa dan pilihan materi berikutnya untuk Anda.";

export interface WaitlistFounderStoryProps {
  email: string;
  siteUrl: string;
  preferencesUrl: string;
  unsubscribeUrl: string;
  referralUrl?: string;
  nextMaterialUrl: string;
}

export function WaitlistFounderStoryEmail(props: WaitlistFounderStoryProps) {
  return (
    <BrandedEmailLayout
      {...props}
      previewText={WAITLIST_FOUNDER_STORY_PREVIEW}
      ctaLabel="Pilih materi berikutnya"
      ctaUrl={props.nextMaterialUrl}
    >
      <h1 style={emailTextStyles.heading}>
        Mengapa kami memulai dari pendidikan
      </h1>
      <p style={emailTextStyles.paragraph}>Halo,</p>
      <p style={emailTextStyles.paragraph}>
        Bursa berawal dari pengamatan sederhana: banyak orang diminta
        membuat keputusan finansial sebelum memiliki bahasa dan kerangka untuk
        menilai pilihannya.
      </p>
      <p style={emailTextStyles.paragraph}>
        Karena itu, kami memilih memulai dari pendidikan. Kami ingin membuat
        konsep yang terasa rumit menjadi lebih mudah diperiksa, tanpa menutupi
        ketidakpastian, tanpa mendorong keputusan terburu-buru, dan tanpa
        menjanjikan hasil.
      </p>
      <p style={emailTextStyles.paragraph}>
        Produk yang baik seharusnya membantu pengguna bertanya dengan lebih
        tajam, bukan sekadar memberi lebih banyak informasi. Masukan Anda akan
        membantu kami memilih materi yang paling relevan untuk dibangun
        berikutnya.
      </p>
      <p style={{ ...emailTextStyles.paragraph, color: emailTextStyles.muted }}>
        Tim pendiri Bursa
      </p>
    </BrandedEmailLayout>
  );
}

export function waitlistFounderStoryPlainText(
  props: WaitlistFounderStoryProps,
): string {
  return [
    "Mengapa kami memulai dari pendidikan",
    "",
    "Bursa berawal dari pengamatan sederhana: banyak orang diminta membuat keputusan finansial sebelum memiliki bahasa dan kerangka untuk menilai pilihannya.",
    "",
    "Karena itu, kami memilih memulai dari pendidikan. Kami ingin membuat konsep yang terasa rumit menjadi lebih mudah diperiksa, tanpa menutupi ketidakpastian, tanpa mendorong keputusan terburu-buru, dan tanpa menjanjikan hasil.",
    "",
    "Produk yang baik seharusnya membantu pengguna bertanya dengan lebih tajam, bukan sekadar memberi lebih banyak informasi. Masukan Anda akan membantu kami memilih materi yang paling relevan untuk dibangun berikutnya.",
    "",
    "Tim pendiri Bursa",
    "",
    `Pilih materi berikutnya: ${props.nextMaterialUrl}`,
    "",
    plainTextFooter(props),
  ].join("\n");
}

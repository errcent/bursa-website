import {
  BrandedEmailLayout,
  emailTextStyles,
  plainTextFooter,
} from "./branded-email-layout";

export type LaunchEmailKey =
  | "waitlist_launch_announcement"
  | "waitlist_launch_demo"
  | "waitlist_launch_faq"
  | "waitlist_launch_open"
  | "waitlist_launch_followup";

export interface WaitlistLaunchEmailProps {
  email: string;
  siteUrl: string;
  preferencesUrl: string;
  unsubscribeUrl: string;
  launchDate: string;
  launchUrl: string;
}

const content: Record<
  LaunchEmailKey,
  {
    subject: string;
    preview: string;
    heading: string;
    paragraphs: string[];
    cta: string;
  }
> = {
  waitlist_launch_announcement: {
    subject: "Bursa segera dibuka — ini yang perlu kamu tahu",
    preview: "Tanggal akses sudah ditetapkan, tanpa urgensi atau janji yang dibuat-buat.",
    heading: "Tanggal peluncuran Bursa sudah ditetapkan",
    paragraphs: [
      "Bursa akan membuka akses pada {{launchDate}}. Kami mengirim kabar ini agar kamu punya waktu memahami apa yang tersedia dan menentukan apakah pengalaman belajarnya relevan.",
      "Menjadi bagian waitlist tidak mewajibkan pembelian atau deposit apa pun.",
    ],
    cta: "Lihat ringkasan peluncuran",
  },
  waitlist_launch_demo: {
    subject: "Lihat cara pengalaman belajar Bursa bekerja",
    preview: "Demo nyata tentang alur belajar, materi, dan batasannya.",
    heading: "Preview pengalaman belajar Bursa",
    paragraphs: [
      "Kami menyiapkan demo singkat agar kamu dapat menilai alur belajar Bursa berdasarkan pengalaman nyata, bukan klaim pemasaran.",
      "Perhatikan struktur materi, cara risiko dijelaskan, dan apakah pendekatannya sesuai dengan tujuan belajarmu.",
    ],
    cta: "Lihat demo Bursa",
  },
  waitlist_launch_faq: {
    subject: "FAQ sebelum akses Bursa dibuka",
    preview: "Jawaban ringkas tentang akses, materi, biaya, dan ekspektasi.",
    heading: "Pertanyaan penting sebelum Bursa dibuka",
    paragraphs: [
      "Akses Bursa dibuka pada {{launchDate}}. Kami merangkum pertanyaan yang paling sering muncul tentang materi, mentor, biaya, dan dukungan.",
      "Bursa adalah platform edukasi. Materi tidak menjanjikan profit dan bukan pengganti penilaian risiko pribadi.",
    ],
    cta: "Baca FAQ peluncuran",
  },
  waitlist_launch_open: {
    subject: "Akses Bursa sekarang sudah dibuka",
    preview: "Jelajahi Bursa dan putuskan dengan informasi yang lengkap.",
    heading: "Bursa resmi dibuka",
    paragraphs: [
      "Akses Bursa kini tersedia. Kamu dapat menjelajahi katalog, pendekatan belajar, dan informasi mentor sebelum mengambil keputusan.",
      "Tidak ada kewajiban untuk langsung mendaftar kelas. Gunakan informasi yang tersedia untuk menilai relevansinya.",
    ],
    cta: "Buka Bursa",
  },
  waitlist_launch_followup: {
    subject: "Masih mempertimbangkan Bursa?",
    preview: "Ringkasan terakhir untuk membantu keputusanmu, tanpa tekanan.",
    heading: "Ada yang masih ingin kamu pastikan?",
    paragraphs: [
      "Kamu menerima email ini karena sempat berinteraksi dengan kabar peluncuran tetapi belum membuat akun.",
      "Jika ada hal yang belum jelas, balas email ini. Tim kami akan menjawab secara langsung tanpa tekanan untuk membeli.",
    ],
    cta: "Tinjau Bursa sekali lagi",
  },
};

export function WaitlistLaunchEmail({
  emailKey,
  ...props
}: WaitlistLaunchEmailProps & { emailKey: LaunchEmailKey }) {
  const item = content[emailKey];
  return (
    <BrandedEmailLayout
      {...props}
      previewText={item.preview}
      ctaLabel={item.cta}
      ctaUrl={props.launchUrl}
    >
      <h1 style={emailTextStyles.heading}>{item.heading}</h1>
      {item.paragraphs.map((paragraph) => (
        <p key={paragraph} style={emailTextStyles.paragraph}>
          {paragraph.replace("{{launchDate}}", props.launchDate)}
        </p>
      ))}
    </BrandedEmailLayout>
  );
}

export function waitlistLaunchPlainText(
  emailKey: LaunchEmailKey,
  props: WaitlistLaunchEmailProps
): string {
  const item = content[emailKey];
  return [
    item.heading,
    "",
    ...item.paragraphs.flatMap((paragraph) => [
      paragraph.replace("{{launchDate}}", props.launchDate),
      "",
    ]),
    `${item.cta}: ${props.launchUrl}`,
    "",
    plainTextFooter(props),
  ].join("\n");
}

export const waitlistLaunchEmailDefinitions = Object.fromEntries(
  (Object.keys(content) as LaunchEmailKey[]).map((key) => [
    key,
    {
      ...content[key],
      createNode: (props: WaitlistLaunchEmailProps) => (
        <WaitlistLaunchEmail emailKey={key} {...props} />
      ),
      plainText: (props: WaitlistLaunchEmailProps) => waitlistLaunchPlainText(key, props),
    },
  ])
) as Record<
  LaunchEmailKey,
  (typeof content)[LaunchEmailKey] & {
    createNode: (props: WaitlistLaunchEmailProps) => React.ReactElement;
    plainText: (props: WaitlistLaunchEmailProps) => string;
  }
>;


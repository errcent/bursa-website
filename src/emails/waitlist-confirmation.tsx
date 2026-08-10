import {
  BrandedEmailLayout,
  emailTextStyles,
  plainTextFooter,
} from "./branded-email-layout";

export const WAITLIST_CONFIRMATION_SUBJECT_SUGGESTIONS = [
  "Pendaftaran Bursa Nalar Anda sudah dikonfirmasi",
  "Selamat datang di pembaruan edukasi Bursa Nalar",
] as const;

export const WAITLIST_CONFIRMATION_PREHEADER_SUGGESTIONS = [
  "Status Anda sudah dikonfirmasi. Atur topik dan frekuensi yang paling relevan.",
  "Terima materi edukasi pilihan dari Bursa Nalar tanpa janji hasil finansial.",
] as const;

export const WAITLIST_CONFIRMATION_SUBJECT =
  WAITLIST_CONFIRMATION_SUBJECT_SUGGESTIONS[0];
export const WAITLIST_CONFIRMATION_PREVIEW =
  WAITLIST_CONFIRMATION_PREHEADER_SUGGESTIONS[0];

export interface WaitlistConfirmationProps {
  email: string;
  siteUrl: string;
  preferencesUrl: string;
  unsubscribeUrl: string;
  referralUrl?: string;
}

export function WaitlistConfirmationEmail(props: WaitlistConfirmationProps) {
  return (
    <BrandedEmailLayout
      {...props}
      previewText={WAITLIST_CONFIRMATION_PREVIEW}
      ctaLabel="Atur preferensi dan lihat pratinjau"
      ctaUrl={props.preferencesUrl}
    >
      <h1 style={emailTextStyles.heading}>Pendaftaran Anda sudah dikonfirmasi</h1>
      <p style={emailTextStyles.paragraph}>Halo,</p>
      <p style={emailTextStyles.paragraph}>
        Terima kasih telah bergabung dengan Bursa Nalar. Status pendaftaran
        Anda sudah <strong>dikonfirmasi</strong>.
      </p>
      <p style={emailTextStyles.paragraph}>
        Kami akan mengirim materi edukasi ringkas sekitar satu kali per minggu,
        ditambah pembaruan produk penting bila diperlukan. Fokus kami adalah
        membantu Anda memahami proses berpikir, risiko, dan pilihan, bukan
        menjanjikan hasil finansial.
      </p>
      <p style={emailTextStyles.paragraph}>
        Anda dapat memilih topik, menyesuaikan frekuensi, dan melihat pratinjau
        materi melalui tombol di bawah.
      </p>
    </BrandedEmailLayout>
  );
}

export function waitlistConfirmationPlainText(
  props: WaitlistConfirmationProps,
): string {
  return [
    "Pendaftaran Anda sudah dikonfirmasi",
    "",
    "Halo,",
    "",
    "Terima kasih telah bergabung dengan Bursa Nalar. Status pendaftaran Anda sudah dikonfirmasi.",
    "",
    "Kami akan mengirim materi edukasi ringkas sekitar satu kali per minggu, ditambah pembaruan produk penting bila diperlukan. Fokus kami adalah membantu Anda memahami proses berpikir, risiko, dan pilihan, bukan menjanjikan hasil finansial.",
    "",
    `Atur preferensi dan lihat pratinjau: ${props.preferencesUrl}`,
    "",
    plainTextFooter(props),
  ].join("\n");
}

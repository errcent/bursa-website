import { legalEntityCopy } from "@/lib/legal/entity";
import { PREVIEW_CATALOG_COPY } from "@/lib/preview-catalog/copy";

export interface HomeFaq {
  id: string;
  question: string;
  answer: string;
}

export const homeFaqs: HomeFaq[] = [
  {
    id: "uniqueness",
    question: "Apa yang membuat Bursa berbeda dari platform edukasi trading dan investasi lain?",
    answer:
      "Kurikulum berjenjang dan terkurasi bersama praktisi profesional terverifikasi, bukan tumpukan video acak, bukan sinyal, dan bukan broker. Fokus kami edukasi terstruktur dengan konteks risiko; kami tidak menjanjikan keuntungan.",
  },
  {
    id: "not-broker",
    question: "Apakah Bursa mengelola uang atau trading saya?",
    answer:
      "Tidak. Bursa adalah platform edukasi, bukan broker atau penasihat investasi. Kami tidak menyimpan saldo, tidak mengeksekusi order, dan tidak mengelola portofolio kamu.",
  },
  {
    id: "preview-catalog",
    question: "Apakah katalog dan mentor yang tampil sudah data resmi?",
    answer: PREVIEW_CATALOG_COPY.bannerDetail,
  },
  {
    id: "legal-entity",
    question: legalEntityCopy.id.helpQuestion,
    answer: legalEntityCopy.id.helpAnswer,
  },
  {
    id: "beginners",
    question: "Apakah Bursa cocok untuk pemula dan investor jangka panjang?",
    answer:
      "Ya. Kurikulum dirancang untuk berbagai level, dari pemula hingga lebih lanjut, dan mencakup trading serta investasi jangka panjang. Di katalog demonstrasi, badge level dan filter instrumen menunjukkan contoh cara menemukan kelas yang cocok; materi resmi mengikuti kurasi saat peluncuran.",
  },
  {
    id: "early-access",
    question: "Bagaimana saya bisa mengakses seluruh kelas nanti?",
    answer:
      "Platform inti masih disiapkan. Pembayaran dan pendaftaran publik belum dibuka. Sekarang kamu bisa menjelajahi katalog demonstrasi, preview, dan Panduan Belajar tanpa akun. Gabung waitlist di /waitlist untuk early access saat akses penuh diluncurkan.",
  },
];

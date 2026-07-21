export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalDocument {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export const termsOfService: LegalDocument = {
  slug: "syarat-dan-ketentuan",
  title: "Syarat & Ketentuan",
  eyebrow: "Legal",
  description:
    "Ketentuan penggunaan platform Bursa Trading Academy. Dengan mengakses atau menggunakan layanan kami, kamu menyetujui syarat berikut.",
  lastUpdated: "1 Juli 2026",
  sections: [
    {
      id: "definisi",
      title: "1. Definisi",
      paragraphs: [
        "Bursa Trading Academy (\"Bursa\", \"kami\") adalah platform edukasi trading yang menyediakan katalog kelas, profil mentor, dan ruang komunitas belajar.",
        "\"Pengguna\" mencakup pelajar, mentor, dan pengunjung yang mengakses platform. \"Mentor\" adalah instruktur terverifikasi yang mempublikasikan kelas atau konten edukasi melalui platform.",
      ],
    },
    {
      id: "layanan",
      title: "2. Ruang Lingkup Layanan",
      paragraphs: [
        "Bursa menyediakan infrastruktur edukasi — bukan layanan broker, eksekusi trading, atau rekomendasi investasi personal.",
        "Semua materi kelas bersifat edukatif. Keputusan trading dan investasi sepenuhnya menjadi tanggung jawab pengguna.",
      ],
      bullets: [
        "Katalog kelas dan profil mentor",
        "Ruang belajar terstruktur dengan video dan progress",
        "Komunitas diskusi dan sinyal internal (untuk anggota berlangganan ruang tertentu)",
        "Pembayaran kelas langsung ke mentor dengan komisi platform",
      ],
    },
    {
      id: "akun",
      title: "3. Akun Pengguna",
      paragraphs: [
        "Kamu wajib memberikan informasi yang akurat saat mendaftar dan menjaga kerahasiaan kredensial akun.",
        "Kami berhak menangguhkan atau menutup akun yang melanggar ketentuan, menyebarkan konten menyesatkan, atau terlibat dalam aktivitas penipuan.",
      ],
    },
    {
      id: "mentor",
      title: "4. Ketentuan Mentor",
      paragraphs: [
        "Mentor wajib melalui proses verifikasi sebelum profil dan kelas dipublikasikan. Mentor bertanggung jawab atas keakuratan materi, kepatuhan regulasi, dan komunikasi yang transparan kepada murid.",
        "Mentor dilarang menjanjikan keuntungan pasti, menyalahgunakan data murid, atau mengarahkan murid ke skema investasi di luar platform tanpa pengungkapan risiko yang memadai.",
      ],
      bullets: [
        "Materi kelas ditinjau tim Bursa sebelum publikasi",
        "Komisi platform sebesar 25% dari setiap transaksi kelas",
        "Mentor wajib mematuhi kebijakan privasi dan perlindungan konten internal",
      ],
    },
    {
      id: "pembayaran",
      title: "5. Pembayaran & Transaksi",
      paragraphs: [
        "Pembayaran kelas dilakukan per kelas (bukan per modul atau langganan bulanan platform). Setelah pembayaran berhasil, akses kelas aktif sesuai ketentuan produk.",
        "Semua pembelian bersifat final. Platform tidak menyediakan pengembalian dana (refund) untuk pembelian kelas.",
        "Rincian komisi platform dan payout mentor dijelaskan pada halaman checkout sebelum konfirmasi pembayaran.",
      ],
    },
    {
      id: "ulasan",
      title: "6. Rating & Ulasan",
      paragraphs: [
        "Fitur rating, ulasan, dan komentar publik dari pengguna saat ini tidak tersedia di platform.",
        "Rating agregat yang ditampilkan pada kartu kelas (jika ada) berasal dari data internal platform, bukan dari formulir ulasan terbuka pengguna.",
      ],
    },
    {
      id: "konten",
      title: "7. Hak Kekayaan Intelektual",
      paragraphs: [
        "Materi kelas, video, dan konten mentor tetap menjadi milik mentor atau pemberi lisensi. Pengguna mendapat lisensi terbatas untuk akses pribadi dan non-komersial.",
        "Dilarang merekam, mendistribusikan, atau menjual ulang konten kelas tanpa izin tertulis. Pelanggaran dapat mengakibatkan penangguhan akun dan tindakan hukum.",
      ],
    },
    {
      id: "risiko",
      title: "8. Penyangkalan Risiko",
      paragraphs: [
        "Trading dan investasi mengandung risiko kerugian modal. Performa masa lalu tidak menjamin hasil di masa depan.",
        "Bursa tidak bertanggung jawab atas kerugian finansial yang timbul dari keputusan trading pengguna berdasarkan materi edukasi di platform.",
      ],
    },
    {
      id: "perubahan",
      title: "9. Perubahan Ketentuan",
      paragraphs: [
        "Kami dapat memperbarui syarat ini sewaktu-waktu. Perubahan material akan diberitahukan melalui email atau notifikasi platform. Penggunaan berkelanjutan setelah perubahan dianggap sebagai persetujuan.",
      ],
    },
  ],
};

export const privacyPolicy: LegalDocument = {
  slug: "kebijakan-privasi",
  title: "Kebijakan Privasi",
  eyebrow: "Legal",
  description:
    "Cara Bursa mengumpulkan, menggunakan, dan melindungi data pribadimu saat menggunakan platform edukasi trading kami.",
  lastUpdated: "11 Juli 2026",
  sections: [
    {
      id: "data-dikumpulkan",
      title: "1. Data yang Kami Kumpulkan",
      paragraphs: ["Kami mengumpulkan data yang kamu berikan langsung dan data penggunaan otomatis:"],
      bullets: [
        "Identitas: nama, email, nomor telepon (opsional), username",
        "Akun: kata sandi ter-hash (bcrypt), preferensi tampilan, riwayat enrollment",
        "Login Google (opsional): email, nama tampilan, dan URL foto profil publik dari akun Google — kami tidak mengakses Gmail, kontak, atau kalender",
        "Reset kata sandi: alamat email untuk mengirim tautan reset (token disimpan sebagai hash, bukan plaintext)",
        "Transaksi: kelas yang dibeli, status pembayaran, bukti transaksi",
        "Komunitas: pesan chat, reaksi, dan aktivitas di ruang diskusi",
        "Teknis: alamat IP, perangkat, log akses untuk keamanan",
      ],
    },
    {
      id: "penggunaan",
      title: "2. Cara Kami Menggunakan Data",
      paragraphs: ["Data digunakan untuk menyediakan dan meningkatkan layanan platform:"],
      bullets: [
        "Autentikasi akun (email/kata sandi atau Google) dan manajemen enrollment kelas",
        "Pemrosesan pembayaran dan rekonsiliasi dengan mentor",
        "Pengiriman tautan reset kata sandi saat kamu memintanya",
        "Komunikasi penting terkait kelas, pembaruan, dan keamanan",
        "Moderasi konten dan pencegahan penyalahgunaan",
        "Analitik agregat untuk meningkatkan pengalaman belajar (tanpa menjual data pribadi)",
      ],
    },
    {
      id: "berbagi",
      title: "3. Berbagi Data dengan Pihak Ketiga",
      paragraphs: [
        "Kami tidak menjual data pribadimu. Data dapat dibagikan kepada penyedia layanan tepercaya (pembayaran, hosting, email) yang terikat perjanjian kerahasiaan.",
        "Login Google memproses data melalui Google OAuth — hanya email dan profil publik. Kamu bisa mencabut akses Google kapan saja melalui pengaturan akun Google (Security → Third-party access).",
        "Mentor menerima informasi terbatas yang diperlukan untuk mengelola murid dan kelas (nama, email enrollment, progress belajar).",
      ],
    },
    {
      id: "penyimpanan",
      title: "4. Penyimpanan & Keamanan",
      paragraphs: [
        "Data disimpan di server dengan enkripsi transit (TLS) dan kontrol akses berbasis peran. Kata sandi di-hash dengan bcrypt (cost ≥ 12) dan tidak pernah disimpan dalam bentuk plain text.",
        "Tautan reset kata sandi berlaku 30 menit, single-use, dan disimpan sebagai hash di database. Permintaan reset selalu mendapat respons yang sama untuk mencegah enumerasi email.",
        "Kami menyimpan data selama akun aktif atau sesuai kewajiban hukum. Kamu dapat meminta penghapusan akun melalui pengaturan atau kontak support.",
      ],
    },
    {
      id: "hak-pengguna",
      title: "5. Hak Pengguna",
      paragraphs: ["Sesuai peraturan perlindungan data yang berlaku, kamu berhak untuk:"],
      bullets: [
        "Mengakses dan memperbarui data profil",
        "Meminta salinan data pribadi yang kami simpan",
        "Menarik persetujuan pemrosesan data non-esensial",
        "Meminta penghapusan akun (dengan pengecualian data yang wajib disimpan secara hukum)",
      ],
    },
    {
      id: "cookie",
      title: "6. Cookie & Penyimpanan Lokal",
      paragraphs: [
        "Kami menggunakan cookie dan local storage untuk sesi login, preferensi tema, dan fungsi dasar platform. Cookie analitik (jika ada) dapat dinonaktifkan melalui pengaturan browser.",
      ],
    },
    {
      id: "kontak",
      title: "7. Kontak Privasi",
      paragraphs: [
        "Untuk pertanyaan terkait privasi atau permintaan data, hubungi tim kami di privacy@bursa.id. Kami akan merespons dalam waktu maksimal 14 hari kerja.",
      ],
    },
  ],
};

export const legalDocuments = [termsOfService, privacyPolicy] as const;

export function getLegalDocument(slug: string): LegalDocument | undefined {
  return legalDocuments.find((doc) => doc.slug === slug);
}

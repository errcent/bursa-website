import type { Course, Mentor, Review } from "./types";
import { defaultCourseThumbnailPath } from "./courses/thumbnails";

/**
 * Seluruh data di file ini adalah DATA DUMMY untuk kebutuhan prototype visual.
 * Nama mentor, angka performa, dan testimoni bersifat fiktif — belum ada
 * mentor/emiten sungguhan yang diverifikasi. Lihat dokumentasi produk di
 * folder "01 - Riset & Strategi" dan "04 - Konten & Instruktur" untuk kriteria
 * kurasi mentor sesungguhnya sebelum data ini diganti data real.
 */

export const mentors: Mentor[] = [
  {
    slug: "andra-wicaksono",
    name: "Andra Wicaksono, CFA",
    title: "Value Investing & Analisis Fundamental Saham",
    initials: "AW",
    avatarUrl: "/mentors/andra-wicaksono.png",
    cutoutUrl: "/mentors/andra-wicaksono.svg",
    instruments: ["Saham"],
    verified: true,
    licenseLabel: "Terdaftar WPPE-OJK No. 09231",
    yearsExperience: 14,
    studentsCount: 8420,
    coursesCount: 4,
    rating: 4.9,
    bio: "Mantan Head of Equity Research di salah satu sekuritas nasional, kini aktif membedah laporan keuangan emiten BEI setiap minggu. Dikenal karena pendekatan konservatif berbasis data, bukan hype.",
    philosophy:
      "\"Trading tanpa memahami valuasi itu judi berbaju analisis. Saya mengajar cara berpikir seorang analis, bukan cuma sinyal beli-jual.\"",
    trackRecord: [12, 18, 15, 24, 22, 30, 28, 35, 33, 41, 38, 46],
    availableFor1on1: true,
    sessionPrice: "Rp750.000 / 45 menit",
  },
  {
    slug: "kirana-ayu",
    name: "Kirana Ayu",
    title: "Crypto & On-Chain Analysis",
    initials: "KA",
    avatarUrl: "/mentors/kirana-ayu.png",
    cutoutUrl: "/mentors/kirana-ayu.svg",
    instruments: ["Crypto"],
    verified: true,
    licenseLabel: "Sertifikasi Kompetensi Aset Kripto — Bappebti",
    yearsExperience: 7,
    studentsCount: 6210,
    coursesCount: 3,
    rating: 4.8,
    bio: "Trader aktif sejak siklus bull-run 2017, kini fokus riset on-chain data dan manajemen risiko portofolio kripto. Vokal soal edukasi anti-FOMO di komunitas kripto Indonesia.",
    philosophy:
      "\"Crypto itu volatil, tapi keputusan kamu nggak harus ikut-ikutan volatil. Manajemen risiko dulu, baru bicara cuan.\"",
    trackRecord: [8, 14, 10, 20, 17, 26, 21, 29, 25, 33, 30, 37],
    availableFor1on1: true,
    sessionPrice: "Rp600.000 / 45 menit",
  },
  {
    slug: "fajar-nugroho",
    name: "Fajar Nugroho",
    title: "Forex & Analisis Makro Global",
    initials: "FN",
    avatarUrl: "/mentors/fajar-nugroho.png",
    cutoutUrl: "/mentors/fajar-nugroho.svg",
    instruments: ["Forex"],
    verified: true,
    licenseLabel: "Eks Institutional Trading Desk 12 Tahun",
    yearsExperience: 12,
    studentsCount: 4120,
    coursesCount: 3,
    rating: 4.7,
    bio: "Menghabiskan lebih dari satu dekade di meja trading institusional sebelum memutuskan fokus mengajar. Spesialis membaca korelasi makroekonomi terhadap pergerakan mata uang mayor.",
    philosophy:
      "\"Pasar forex digerakkan oleh narasi makro, bukan cuma candle. Kalau kamu paham 'kenapa', kamu nggak akan panik lihat 'bagaimana'.\"",
    trackRecord: [20, 24, 19, 28, 25, 22, 30, 27, 34, 31, 29, 36],
    availableFor1on1: false,
  },
  {
    slug: "melati-putri",
    name: "Melati Putri",
    title: "Swing Trading & Analisis Teknikal Saham",
    initials: "MP",
    avatarUrl: "/mentors/melati-putri.png",
    cutoutUrl: "/mentors/melati-putri.svg",
    instruments: ["Saham"],
    verified: true,
    licenseLabel: "Terdaftar WPPE-OJK No. 11487",
    yearsExperience: 9,
    studentsCount: 5390,
    coursesCount: 5,
    rating: 4.8,
    bio: "Praktisi swing trading harian dengan gaya mengajar yang runtut dan sabar untuk pemula. Membangun komunitas belajar teknikal terbesar di platform ini.",
    philosophy:
      "\"Chart itu bahasa, bukan ramalan. Begitu kamu fasih membacanya, kamu berhenti menebak dan mulai membuat keputusan.\"",
    trackRecord: [10, 16, 14, 19, 23, 21, 27, 24, 31, 28, 33, 35],
    availableFor1on1: true,
    sessionPrice: "Rp500.000 / 30 menit",
  },
  {
    slug: "bimo-satrio",
    name: "Bimo Satrio",
    title: "Crypto Trading & Risk Management",
    initials: "BS",
    avatarUrl: "/mentors/bimo-satrio.png",
    cutoutUrl: "/mentors/bimo-satrio.svg",
    instruments: ["Crypto"],
    verified: false,
    yearsExperience: 5,
    studentsCount: 1840,
    coursesCount: 2,
    rating: 4.6,
    bio: "Mentor baru bergabung dengan fokus manajemen risiko untuk trader kripto pemula. Sedang dalam proses verifikasi kredensial oleh tim compliance internal.",
    philosophy:
      "\"Tujuan pertama trader pemula bukan cuan besar, tapi bertahan hidup di market minimal 2 tahun. Baru setelah itu bicara konsistensi.\"",
    trackRecord: [5, 8, 7, 11, 9, 13, 12, 16, 14, 18, 17, 20],
    availableFor1on1: false,
  },
  {
    slug: "rangga-dewantara",
    name: "Rangga Dewantara",
    title: "Fundamental & Valuasi Saham Lanjutan",
    initials: "RD",
    avatarUrl: "/mentors/rangga-dewantara.png",
    cutoutUrl: "/mentors/rangga-dewantara.svg",
    instruments: ["Saham"],
    verified: true,
    licenseLabel: "Terdaftar WPPE-OJK No. 07765",
    yearsExperience: 16,
    studentsCount: 7025,
    coursesCount: 4,
    rating: 4.9,
    bio: "Konsultan valuasi perusahaan sebelum terjun penuh ke edukasi publik. Kelasnya dikenal padat data namun tetap mudah diikuti pemula menengah.",
    philosophy:
      "\"Harga adalah apa yang kamu bayar, nilai adalah apa yang kamu dapat. Course saya mengajarkan cara menghitung yang kedua.\"",
    trackRecord: [15, 21, 18, 26, 24, 32, 29, 37, 34, 42, 39, 47],
    availableFor1on1: true,
    sessionPrice: "Rp850.000 / 45 menit",
  },
];

export const courses: Course[] = [
  {
    slug: "fundamental-saham-untuk-pemula",
    title: "Fundamental Saham untuk Pemula: Dari Nol ke Analisis Laporan Keuangan",
    mentorSlug: "andra-wicaksono",
    instrument: "Saham",
    level: "Pemula",
    thumbnailUrl: defaultCourseThumbnailPath("fundamental-saham-untuk-pemula"),
    price: 799000,
    rating: 4.9,
    studentsCount: 3240,
    durationHours: 6,
    shortDescription:
      "Kelas fondasi untuk memahami cara membaca laporan keuangan emiten dan menilai kualitas bisnis sebelum membeli sahamnya — tanpa jargon yang membingungkan.",
    outcomes: [
      "Membaca laporan neraca, laba-rugi, dan arus kas dengan percaya diri",
      "Menghitung rasio kunci (PER, PBV, ROE, DER) dan memahami artinya",
      "Menyaring saham berkualitas dari ribuan emiten di BEI",
      "Menghindari jebakan 'saham gorengan' lewat red flag laporan keuangan",
    ],
    modules: [
      {
        title: "Modul 1 — Mengenal Dunia Saham",
        lessons: [
          { id: "l1", title: "Kenapa Belajar Fundamental, Bukan Ikut-ikutan", durationMinutes: 12, preview: true },
          { id: "l2", title: "Anatomi Laporan Keuangan Emiten", durationMinutes: 18 },
          { id: "l3", title: "Studi Kasus: Membaca Laporan BBCA", durationMinutes: 22 },
        ],
      },
      {
        title: "Modul 2 — Rasio & Valuasi Dasar",
        lessons: [
          { id: "l4", title: "PER dan PBV: Mahal atau Murah?", durationMinutes: 20 },
          { id: "l5", title: "ROE, DER, dan Kesehatan Bisnis", durationMinutes: 19 },
          { id: "l6", title: "Latihan: Bandingkan 3 Emiten Sejenis", durationMinutes: 25 },
        ],
      },
      {
        title: "Modul 3 — Membangun Watchlist Pertama",
        lessons: [
          { id: "l7", title: "Kriteria Screening Saham Berkualitas", durationMinutes: 17 },
          { id: "l8", title: "Menyusun Watchlist & Rencana Belajar Lanjutan", durationMinutes: 14 },
        ],
      },
    ],
  },
  {
    slug: "membaca-laporan-keuangan-lanjutan",
    title: "Analisis Valuasi Lanjutan: DCF dan Relative Valuation Praktis",
    mentorSlug: "rangga-dewantara",
    instrument: "Saham",
    level: "Menengah",
    thumbnailUrl: defaultCourseThumbnailPath("membaca-laporan-keuangan-lanjutan"),
    price: 1450000,
    rating: 4.9,
    studentsCount: 1870,
    durationHours: 8,
    shortDescription:
      "Pelajari metodologi valuasi yang dipakai analis profesional — DCF dan relative valuation — untuk menilai wajar tidaknya harga sebuah saham secara mandiri.",
    outcomes: [
      "Membangun model DCF sederhana dengan asumsi yang masuk akal",
      "Melakukan relative valuation antar emiten sejenis di satu sektor",
      "Memahami batas & risiko setiap metode valuasi",
      "Menyusun rentang nilai wajar, bukan angka presisi palsu",
    ],
    modules: [
      {
        title: "Modul 1 — Kerangka Berpikir Valuasi",
        lessons: [
          { id: "l1", title: "Harga vs Nilai: Kenapa Keduanya Berbeda", durationMinutes: 14, preview: true },
          { id: "l2", title: "Kapan Pakai DCF, Kapan Pakai Relative Valuation", durationMinutes: 16 },
        ],
      },
      {
        title: "Modul 2 — Discounted Cash Flow (DCF)",
        lessons: [
          { id: "l3", title: "Memproyeksikan Arus Kas Bebas", durationMinutes: 24 },
          { id: "l4", title: "Menentukan Discount Rate yang Wajar", durationMinutes: 20 },
          { id: "l5", title: "Studi Kasus DCF Emiten Konsumer", durationMinutes: 28 },
        ],
      },
      {
        title: "Modul 3 — Relative Valuation",
        lessons: [
          { id: "l6", title: "Memilih Peer Group yang Tepat", durationMinutes: 18 },
          { id: "l7", title: "Studi Kasus Perbandingan Sektor Perbankan", durationMinutes: 22 },
        ],
      },
    ],
  },
  {
    slug: "swing-trading-teknikal-dasar",
    title: "Swing Trading Saham: Membaca Chart Tanpa Bikin Pusing",
    mentorSlug: "melati-putri",
    instrument: "Saham",
    level: "Pemula",
    thumbnailUrl: defaultCourseThumbnailPath("swing-trading-teknikal-dasar"),
    price: 699000,
    rating: 4.8,
    studentsCount: 4110,
    durationHours: 5,
    shortDescription:
      "Panduan runtut membaca candlestick, support-resistance, dan indikator populer untuk mulai swing trading dengan disiplin, bukan tebak-tebakan.",
    outcomes: [
      "Membaca pola candlestick dan struktur harga dasar",
      "Menentukan level support & resistance secara objektif",
      "Menyusun rencana entry, stop loss, dan target harga",
      "Membangun jurnal trading sederhana untuk evaluasi diri",
    ],
    modules: [
      {
        title: "Modul 1 — Bahasa Chart",
        lessons: [
          { id: "l1", title: "Anatomi Candlestick", durationMinutes: 15, preview: true },
          { id: "l2", title: "Support & Resistance Praktis", durationMinutes: 18 },
        ],
      },
      {
        title: "Modul 2 — Menyusun Rencana Trading",
        lessons: [
          { id: "l3", title: "Entry, Stop Loss, dan Target Realistis", durationMinutes: 20 },
          { id: "l4", title: "Position Sizing & Manajemen Risiko", durationMinutes: 17 },
          { id: "l5", title: "Studi Kasus Swing Trade Mingguan", durationMinutes: 23 },
        ],
      },
    ],
  },
  {
    slug: "crypto-on-chain-dasar",
    title: "Membaca Data On-Chain untuk Keputusan Trading Crypto",
    mentorSlug: "kirana-ayu",
    instrument: "Crypto",
    level: "Menengah",
    thumbnailUrl: defaultCourseThumbnailPath("crypto-on-chain-dasar"),
    price: 950000,
    rating: 4.8,
    studentsCount: 2650,
    durationHours: 6,
    shortDescription:
      "Melampaui candlestick — pelajari cara membaca data on-chain (exchange flow, whale activity, network health) untuk memahami kondisi pasar kripto secara lebih dalam.",
    outcomes: [
      "Memahami metrik on-chain dasar (active address, exchange netflow)",
      "Mengenali pola akumulasi & distribusi 'whale'",
      "Menggabungkan data on-chain dengan analisis teknikal",
      "Membangun checklist riset sebelum masuk posisi",
    ],
    modules: [
      {
        title: "Modul 1 — Dasar Data On-Chain",
        lessons: [
          { id: "l1", title: "Apa Itu Data On-Chain dan Kenapa Penting", durationMinutes: 13, preview: true },
          { id: "l2", title: "Membaca Exchange Netflow", durationMinutes: 19 },
        ],
      },
      {
        title: "Modul 2 — Studi Kasus Praktis",
        lessons: [
          { id: "l3", title: "Mengenali Pola Akumulasi Whale", durationMinutes: 21 },
          { id: "l4", title: "Menyusun Checklist Riset Sebelum Entry", durationMinutes: 16 },
        ],
      },
    ],
  },
  {
    slug: "manajemen-risiko-crypto-pemula",
    title: "Manajemen Risiko untuk Trader Crypto Pemula",
    mentorSlug: "bimo-satrio",
    instrument: "Crypto",
    level: "Pemula",
    thumbnailUrl: defaultCourseThumbnailPath("manajemen-risiko-crypto-pemula"),
    price: 499000,
    rating: 4.6,
    studentsCount: 980,
    durationHours: 4,
    shortDescription:
      "Kelas fondasi wajib sebelum trading crypto sungguhan — fokus penuh pada cara bertahan hidup di pasar yang sangat volatil.",
    outcomes: [
      "Memahami ukuran posisi yang aman untuk modal terbatas",
      "Menyusun aturan stop loss pribadi dan mematuhinya",
      "Mengenali bias psikologis umum (FOMO, panic sell)",
      "Membangun rencana trading tertulis pertama",
    ],
    modules: [
      {
        title: "Modul 1 — Mindset Bertahan Hidup",
        lessons: [
          { id: "l1", title: "Kenapa 90% Trader Baru Rugi di Tahun Pertama", durationMinutes: 11, preview: true },
          { id: "l2", title: "Position Sizing untuk Modal Kecil", durationMinutes: 15 },
        ],
      },
      {
        title: "Modul 2 — Aturan & Disiplin",
        lessons: [
          { id: "l3", title: "Menyusun Aturan Stop Loss Pribadi", durationMinutes: 14 },
          { id: "l4", title: "Mengenali Bias Psikologis Trading", durationMinutes: 18 },
        ],
      },
    ],
  },
  {
    slug: "forex-makro-dasar",
    title: "Forex untuk Pemula: Membaca Narasi Makro di Balik Pergerakan Mata Uang",
    mentorSlug: "fajar-nugroho",
    instrument: "Forex",
    level: "Pemula",
    thumbnailUrl: defaultCourseThumbnailPath("forex-makro-dasar"),
    price: 899000,
    rating: 4.7,
    studentsCount: 1560,
    durationHours: 7,
    shortDescription:
      "Pahami kenapa nilai tukar bergerak — suku bunga, inflasi, dan sentimen global — sebelum mulai membaca chart pair forex favoritmu.",
    outcomes: [
      "Memahami hubungan suku bunga bank sentral dengan nilai tukar",
      "Membaca kalender ekonomi dan dampaknya ke pair mayor",
      "Mengenali korelasi antar pair forex populer",
      "Menyusun kerangka analisis makro sebelum trading harian",
    ],
    modules: [
      {
        title: "Modul 1 — Fondasi Makroekonomi",
        lessons: [
          { id: "l1", title: "Kenapa Nilai Tukar Bergerak", durationMinutes: 16, preview: true },
          { id: "l2", title: "Suku Bunga Bank Sentral dan Dampaknya", durationMinutes: 21 },
        ],
      },
      {
        title: "Modul 2 — Membaca Kalender Ekonomi",
        lessons: [
          { id: "l3", title: "Rilis Data yang Wajib Dipantau", durationMinutes: 18 },
          { id: "l4", title: "Studi Kasus Reaksi Pasar Pasca Rilis NFP", durationMinutes: 24 },
        ],
      },
    ],
  },
];

export const reviews: Review[] = [
  {
    name: "Putri A.",
    initials: "PA",
    rating: 5,
    comment:
      "Saya benar-benar pemula. Materinya runtut dan mudah diikuti. Saya juga tidak didorong langsung trading pakai uang asli.",
    date: "2 minggu lalu",
    courseTag: "Fundamental Saham untuk Pemula",
    mentorTag: "Andra Wicaksono, CFA",
  },
  {
    name: "Rian H.",
    initials: "RH",
    rating: 5,
    comment:
      "Saya pernah ikut kelas online yang isinya rangkuman umum saja. Di sini ada latihan per modul, jadi belajarnya lebih terarah.",
    date: "1 bulan lalu",
    courseTag: "Membaca Data On-Chain untuk Keputusan Trading Crypto",
    mentorTag: "Kirana Ayu",
  },
  {
    name: "Nadia F.",
    initials: "NF",
    rating: 4,
    comment:
      "Kontennya bagus dan tidak menjual janji profit. Fokusnya edukasi proses. Ke depan akan lebih kuat jika studi kasusnya ditambah.",
    date: "1 bulan lalu",
    courseTag: "Forex untuk Pemula: Membaca Narasi Makro",
    mentorTag: "Fajar Nugroho",
  },
];

export function getMentorBySlug(slug: string): Mentor | undefined {
  return mentors.find((m) => m.slug === slug);
}

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

export function getCoursesByMentor(mentorSlug: string): Course[] {
  return courses.filter((c) => c.mentorSlug === mentorSlug);
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

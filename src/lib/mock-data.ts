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
    avatarUrl: "/mentors/andra-wicaksono.svg",
    cutoutUrl: "/mentors/andra-wicaksono.svg",
    instruments: ["Saham"],
    verified: true,
    licenseLabel: "Terdaftar WPPE-OJK No. 09231",
    yearsExperience: 14,
    studentsCount: 8420,
    coursesCount: 2,
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
    avatarUrl: "/mentors/kirana-ayu.svg",
    cutoutUrl: "/mentors/kirana-ayu.svg",
    instruments: ["Crypto"],
    verified: true,
    licenseLabel: "Sertifikasi Kompetensi Aset Kripto — Bappebti",
    yearsExperience: 7,
    studentsCount: 6210,
    coursesCount: 2,
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
    avatarUrl: "/mentors/fajar-nugroho.svg",
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
    avatarUrl: "/mentors/melati-putri.svg",
    cutoutUrl: "/mentors/melati-putri.svg",
    instruments: ["Saham"],
    verified: true,
    licenseLabel: "Terdaftar WPPE-OJK No. 11487",
    yearsExperience: 9,
    studentsCount: 5390,
    coursesCount: 2,
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
    avatarUrl: "/mentors/bimo-satrio.svg",
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
    avatarUrl: "/mentors/rangga-dewantara.svg",
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
  {
    slug: "dian-pratiwi",
    name: "Dian Pratiwi",
    title: "Scalping Saham IDX & Eksekusi Intraday",
    initials: "DP",
    instruments: ["Saham"],
    verified: true,
    licenseLabel: "Terdaftar WPPE-OJK No. 12834",
    yearsExperience: 8,
    studentsCount: 3890,
    coursesCount: 2,
    rating: 4.7,
    bio: "Ex-day trader di meja prop lokal, kini fokus mengajar scalping saham IDX dengan aturan risiko ketat. Dikenal karena checklist entry yang bisa langsung dipakai di jam perdagangan pagi.",
    philosophy:
      "\"Scalping bukan cari cuan cepat — scalping adalah disiplin eksekusi berulang dengan edge kecil yang konsisten.\"",
    trackRecord: [6, 11, 9, 14, 12, 17, 15, 20, 18, 23, 21, 26],
    availableFor1on1: true,
    sessionPrice: "Rp550.000 / 30 menit",
  },
  {
    slug: "hendra-wijaya",
    name: "Hendra Wijaya",
    title: "Price Action & Scalping Forex",
    initials: "HW",
    instruments: ["Forex"],
    verified: true,
    licenseLabel: "Eks Senior Dealer FX — 10 Tahun",
    yearsExperience: 10,
    studentsCount: 2980,
    coursesCount: 2,
    rating: 4.8,
    bio: "Spesialis price action tanpa indikator berlebihan. Mengajar cara membaca struktur pasar mayor (EUR/USD, GBP/JPY) di sesi London dan New York dengan risk-reward yang realistis.",
    philosophy:
      "\"Indikator membantu, tapi struktur harga yang jelas lebih jujur. Kalau chart-nya ribet, biasanya bukan setup-nya yang bagus.\"",
    trackRecord: [9, 13, 11, 16, 14, 19, 17, 22, 20, 25, 23, 28],
    availableFor1on1: false,
  },
  {
    slug: "salsa-maharani",
    name: "Salsa Maharani",
    title: "DeFi, Tokenomics & Riset Kripto",
    initials: "SM",
    instruments: ["Crypto"],
    verified: true,
    licenseLabel: "Sertifikasi Kompetensi Aset Kripto — Bappebti",
    yearsExperience: 6,
    studentsCount: 2140,
    coursesCount: 2,
    rating: 4.7,
    bio: "Peneliti DeFi independen yang aktif membedah whitepaper dan tokenomics sebelum masuk posisi. Kelasnya cocok untuk trader kripto yang ingin naik level dari sekadar chart ke riset fundamental on-chain.",
    philosophy:
      "\"Di kripto, narrative bisa menggerakkan harga — tapi tokenomics yang buruk tetap akan kehabisan bahan bakar. Riset dulu, FOMO belakangan.\"",
    trackRecord: [4, 7, 6, 10, 9, 13, 11, 15, 14, 18, 16, 21],
    availableFor1on1: true,
    sessionPrice: "Rp650.000 / 45 menit",
  },
  {
    slug: "arif-kurniawan",
    name: "Arif Kurniawan",
    title: "Psikologi Trading & Manajemen Risiko",
    initials: "AK",
    instruments: ["Saham", "Forex"],
    verified: true,
    licenseLabel: "Certified Trading Coach — BAPPEBTI",
    yearsExperience: 11,
    studentsCount: 4520,
    coursesCount: 2,
    rating: 4.9,
    bio: "Mentor lintas instrumen dengan fokus disiplin, journaling, dan manajemen risiko portofolio. Banyak alumni dari trader yang sudah paham teknikal tapi masih sering overtrade.",
    philosophy:
      "\"Edge terbesar kebanyakan trader bukan strategi baru — tapi kemampuan berhenti trading saat kondisi mental sedang buruk.\"",
    trackRecord: [11, 15, 13, 18, 16, 21, 19, 24, 22, 27, 25, 30],
    availableFor1on1: true,
    sessionPrice: "Rp700.000 / 45 menit",
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
      {
        title: "Modul 4 — Studi Kasus Emiten BEI",
        lessons: [
          { id: "l9", title: "Membaca Tren Pendapatan 3 Tahun", durationMinutes: 19 },
          { id: "l10", title: "Red Flag Laporan Keuangan yang Sering Terlewat", durationMinutes: 16 },
          { id: "l11", title: "Latihan: Nilai Wajar vs Harga Pasar Hari Ini", durationMinutes: 22 },
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
      {
        title: "Modul 3 — Indikator Pendukung (Bukan Pengganti Chart)",
        lessons: [
          { id: "l6", title: "Moving Average untuk Konfirmasi Trend", durationMinutes: 16 },
          { id: "l7", title: "RSI & Volume: Kapan Dipakai, Kapan Diabaikan", durationMinutes: 18 },
          { id: "l8", title: "Menyusun Checklist Pre-Trade Harian", durationMinutes: 14 },
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
      {
        title: "Modul 3 — Menyusun Trading Plan Makro",
        lessons: [
          { id: "l5", title: "Bias Harian dari Narasi Makro", durationMinutes: 17 },
          { id: "l6", title: "Korelasi DXY dengan Pair Mayor", durationMinutes: 20 },
          { id: "l7", title: "Template Jurnal Trading Berbasis Makro", durationMinutes: 15 },
        ],
      },
    ],
  },
  {
    slug: "screening-saham-dividen-konsisten",
    title: "Screening Saham Dividen Konsisten untuk Investor Jangka Menengah",
    mentorSlug: "andra-wicaksono",
    instrument: "Saham",
    level: "Menengah",
    thumbnailUrl: defaultCourseThumbnailPath("screening-saham-dividen-konsisten"),
    price: 1099000,
    rating: 4.8,
    studentsCount: 1420,
    durationHours: 5,
    shortDescription:
      "Pelajari cara menyaring emiten dengan riwayat dividen sehat, payout ratio wajar, dan cash flow yang mendukung distribusi berkelanjutan.",
    outcomes: [
      "Memahami payout ratio dan free cash flow untuk dividen",
      "Menyaring saham dividen vs saham yield trap",
      "Membaca kebijakan dividen emiten dari laporan tahunan",
      "Menyusun portofolio dividen diversifikasi sektor",
    ],
    modules: [
      {
        title: "Modul 1 — Dasar Dividen BEI",
        lessons: [
          { id: "l1", title: "Jenis Dividen & Timeline Pembayaran", durationMinutes: 14, preview: true },
          { id: "l2", title: "Yield vs Growth: Pilih Fokus Portofolio", durationMinutes: 17 },
        ],
      },
      {
        title: "Modul 2 — Screening Praktis",
        lessons: [
          { id: "l3", title: "Payout Ratio & DER yang Aman", durationMinutes: 19 },
          { id: "l4", title: "Studi Kasus: Perbankan vs Konsumer", durationMinutes: 21 },
          { id: "l5", title: "Latihan: Susun Watchlist Dividen 10 Emiten", durationMinutes: 24 },
        ],
      },
    ],
  },
  {
    slug: "price-action-swing-saham-menengah",
    title: "Price Action Swing Saham: Struktur Market & Timing Entry",
    mentorSlug: "melati-putri",
    instrument: "Saham",
    level: "Menengah",
    thumbnailUrl: defaultCourseThumbnailPath("price-action-swing-saham-menengah"),
    price: 899000,
    rating: 4.8,
    studentsCount: 1780,
    durationHours: 6,
    shortDescription:
      "Naik level dari teknikal dasar — pelajari struktur higher high/low, zona supply-demand, dan timing entry swing di saham IDX likuid.",
    outcomes: [
      "Mengenali struktur trend dan titik balik (change of character)",
      "Menentukan zona entry berdasarkan price action murni",
      "Menggabungkan timeframe harian dan 4 jam untuk konfirmasi",
      "Menyusun rencana hold 3–10 hari dengan stop loss objektif",
    ],
    modules: [
      {
        title: "Modul 1 — Struktur Pasar",
        lessons: [
          { id: "l1", title: "Higher High, Higher Low — Bahasa Trend", durationMinutes: 16, preview: true },
          { id: "l2", title: "Change of Character vs Pullback Biasa", durationMinutes: 18 },
        ],
      },
      {
        title: "Modul 2 — Zona & Timing",
        lessons: [
          { id: "l3", title: "Supply & Demand di Chart Saham IDX", durationMinutes: 20 },
          { id: "l4", title: "Multi-Timeframe: Daily + 4H", durationMinutes: 22 },
        ],
      },
      {
        title: "Modul 3 — Studi Kasus Live",
        lessons: [
          { id: "l5", title: "Replay Trade: Entry di Zona Demand", durationMinutes: 25 },
          { id: "l6", title: "Kesalahan Umum Swing Trader Pemula", durationMinutes: 15 },
        ],
      },
    ],
  },
  {
    slug: "siklus-bitcoin-halving-dan-makro-kripto",
    title: "Siklus Bitcoin Halving & Makro Kripto untuk Trader Menengah",
    mentorSlug: "kirana-ayu",
    instrument: "Crypto",
    level: "Menengah",
    thumbnailUrl: defaultCourseThumbnailPath("siklus-bitcoin-halving-dan-makro-kripto"),
    price: 1150000,
    rating: 4.8,
    studentsCount: 1340,
    durationHours: 5,
    shortDescription:
      "Pahami bagaimana halving, likuiditas global, dan sentimen makro memengaruhi siklus bull-bear kripto — bukan prediksi harga, tapi kerangka berpikir.",
    outcomes: [
      "Memahami mekanisme halving dan dampak historisnya",
      "Membaca korelasi BTC dengan DXY dan risk-on/risk-off",
      "Menyusun strategi akumulasi vs distribusi per fase siklus",
      "Menghindari FOMO di puncak euforia pasar",
    ],
    modules: [
      {
        title: "Modul 1 — Anatomi Siklus Kripto",
        lessons: [
          { id: "l1", title: "Empat Fase Siklus: Akumulasi hingga Distribusi", durationMinutes: 15, preview: true },
          { id: "l2", title: "Halving: Supply Shock vs Narrative", durationMinutes: 18 },
        ],
      },
      {
        title: "Modul 2 — Makro & On-Chain",
        lessons: [
          { id: "l3", title: "Likuiditas Global & Aliran Dana Institusi", durationMinutes: 20 },
          { id: "l4", title: "Metrik On-Chain untuk Deteksi Fase", durationMinutes: 22 },
          { id: "l5", title: "Studi Kasus Siklus 2020–2024", durationMinutes: 26 },
        ],
      },
    ],
  },
  {
    slug: "scalping-saham-intraday-jam-perdagangan",
    title: "Scalping Saham IDX: Setup Jam Perdagangan Pagi & Sore",
    mentorSlug: "dian-pratiwi",
    instrument: "Saham",
    level: "Pemula",
    thumbnailUrl: defaultCourseThumbnailPath("scalping-saham-intraday-jam-perdagangan"),
    price: 749000,
    rating: 4.7,
    studentsCount: 2210,
    durationHours: 4,
    shortDescription:
      "Kelas praktis scalping saham likuid IDX — fokus jam 09:00–10:30 dan 14:00–15:00 dengan aturan risiko harian yang jelas.",
    outcomes: [
      "Memilih saham likuid yang cocok untuk scalping",
      "Menentukan stop loss harian sebelum buka chart",
      "Mengenali setup breakout dan mean reversion intraday",
      "Menyusun checklist pre-market 10 menit",
    ],
    modules: [
      {
        title: "Modul 1 — Persiapan Pre-Market",
        lessons: [
          { id: "l1", title: "Kriteria Saham Scalping di BEI", durationMinutes: 12, preview: true },
          { id: "l2", title: "Aturan Risiko Harian: Max Loss & Max Trade", durationMinutes: 14 },
        ],
      },
      {
        title: "Modul 2 — Setup Intraday",
        lessons: [
          { id: "l3", title: "Breakout Opening Range", durationMinutes: 18 },
          { id: "l4", title: "Mean Reversion di Sesi Sore", durationMinutes: 16 },
        ],
      },
      {
        title: "Modul 3 — Eksekusi & Review",
        lessons: [
          { id: "l5", title: "Order Types: Limit vs Market di IDX", durationMinutes: 15 },
          { id: "l6", title: "Jurnal Scalp: Template 5 Menit", durationMinutes: 13 },
        ],
      },
    ],
  },
  {
    slug: "eksekusi-scalping-order-book-idx",
    title: "Eksekusi Scalping: Membaca Order Book & Arus Bid-Offer IDX",
    mentorSlug: "dian-pratiwi",
    instrument: "Saham",
    level: "Menengah",
    thumbnailUrl: defaultCourseThumbnailPath("eksekusi-scalping-order-book-idx"),
    price: 999000,
    rating: 4.7,
    studentsCount: 980,
    durationHours: 5,
    shortDescription:
      "Level lanjutan scalping — pelajari cara membaca depth of market, spoofing sederhana, dan timing entry dari arus bid-offer saham tier 1.",
    outcomes: [
      "Membaca order book dan imbalance bid-offer",
      "Mengenali tanda-tanda manipulasi order tipikal",
      "Menyesuaikan size posisi dengan likuiditas saham",
      "Review replay trade dengan screenshot order book",
    ],
    modules: [
      {
        title: "Modul 1 — Dasar Order Book",
        lessons: [
          { id: "l1", title: "Anatomi Bid, Offer, dan Queue", durationMinutes: 16, preview: true },
          { id: "l2", title: "Imbalance & Momentum Singkat", durationMinutes: 19 },
        ],
      },
      {
        title: "Modul 2 — Studi Kasus Tier 1",
        lessons: [
          { id: "l3", title: "Replay: BBCA vs BMRI — Perbedaan Likuiditas", durationMinutes: 22 },
          { id: "l4", title: "Kapan Skip Trade: Spread & Slippage", durationMinutes: 17 },
        ],
      },
    ],
  },
  {
    slug: "price-action-forex-tanpa-indikator",
    title: "Price Action Forex: Struktur Pasar Tanpa Indikator Berlebihan",
    mentorSlug: "hendra-wijaya",
    instrument: "Forex",
    level: "Pemula",
    thumbnailUrl: defaultCourseThumbnailPath("price-action-forex-tanpa-indikator"),
    price: 849000,
    rating: 4.8,
    studentsCount: 1670,
    durationHours: 6,
    shortDescription:
      "Belajar membaca struktur pasar forex mayor dengan candlestick dan level kunci — tanpa dashboard indikator yang membingungkan.",
    outcomes: [
      "Mengidentifikasi trend, range, dan breakout di pair mayor",
      "Menentukan support/resistance dari swing high-low",
      "Menyusun rencana trade dengan risk-reward minimum 1:2",
      "Menghindari overtrading di sesi sepi",
    ],
    modules: [
      {
        title: "Modul 1 — Bahasa Price Action",
        lessons: [
          { id: "l1", title: "Struktur Pasar: Trend vs Range", durationMinutes: 15, preview: true },
          { id: "l2", title: "Swing High/Low sebagai Level Kunci", durationMinutes: 18 },
        ],
      },
      {
        title: "Modul 2 — Pair Mayor",
        lessons: [
          { id: "l3", title: "EUR/USD: Karakter & Sesi Terbaik", durationMinutes: 20 },
          { id: "l4", title: "GBP/JPY: Volatilitas & Manajemen Risiko", durationMinutes: 21 },
        ],
      },
      {
        title: "Modul 3 — Rencana Trade",
        lessons: [
          { id: "l5", title: "Template Trade Plan 1 Halaman", durationMinutes: 14 },
          { id: "l6", title: "Studi Kasus: 3 Trade Kalah & Pelajaran", durationMinutes: 19 },
        ],
      },
    ],
  },
  {
    slug: "scalping-forex-sesi-london-ny",
    title: "Scalping Forex: Strategi Sesi London & New York",
    mentorSlug: "hendra-wijaya",
    instrument: "Forex",
    level: "Menengah",
    thumbnailUrl: defaultCourseThumbnailPath("scalping-forex-sesi-london-ny"),
    price: 1099000,
    rating: 4.8,
    studentsCount: 1120,
    durationHours: 5,
    shortDescription:
      "Fokus pada volatilitas sesi London open dan overlap NY — setup momentum dan pullback cepat dengan stop ketat.",
    outcomes: [
      "Memetakan jam trading optimal per pair",
      "Setup momentum break di London open",
      "Pullback scalp di overlap London-NY",
      "Aturan cut loss harian untuk scalper forex",
    ],
    modules: [
      {
        title: "Modul 1 — Peta Sesi",
        lessons: [
          { id: "l1", title: "Sesi Asia, London, NY: Volatilitas & Spread", durationMinutes: 14, preview: true },
          { id: "l2", title: "Pair Pilihan per Sesi", durationMinutes: 16 },
        ],
      },
      {
        title: "Modul 2 — Setup Scalp",
        lessons: [
          { id: "l3", title: "London Breakout: Rules & Filter", durationMinutes: 20 },
          { id: "l4", title: "NY Pullback: Entry & Invalidation", durationMinutes: 18 },
          { id: "l5", title: "Replay 5 Trade Scalp Minggu Ini", durationMinutes: 24 },
        ],
      },
    ],
  },
  {
    slug: "defi-dan-tokenomics-pemula",
    title: "DeFi & Tokenomics untuk Pemula: Riset Sebelum Beli Token",
    mentorSlug: "salsa-maharani",
    instrument: "Crypto",
    level: "Pemula",
    thumbnailUrl: defaultCourseThumbnailPath("defi-dan-tokenomics-pemula"),
    price: 599000,
    rating: 4.7,
    studentsCount: 890,
    durationHours: 4,
    shortDescription:
      "Pahami dasar DeFi, supply token, vesting, dan red flag tokenomics sebelum masuk ke proyek kripto baru.",
    outcomes: [
      "Membaca whitepaper bagian tokenomics dengan cepat",
      "Memahami FDV, circulating supply, dan unlock schedule",
      "Mengenali red flag: infinite mint, team allocation berlebihan",
      "Checklist riset 15 menit sebelum entry",
    ],
    modules: [
      {
        title: "Modul 1 — Dasar DeFi",
        lessons: [
          { id: "l1", title: "Apa Itu DeFi vs CeFi", durationMinutes: 12, preview: true },
          { id: "l2", title: "AMM, Liquidity Pool, Impermanent Loss", durationMinutes: 17 },
        ],
      },
      {
        title: "Modul 2 — Tokenomics",
        lessons: [
          { id: "l3", title: "Supply, Vesting, & Cliff", durationMinutes: 16 },
          { id: "l4", title: "Studi Kasus: Token Bagus vs Token Trap", durationMinutes: 20 },
        ],
      },
    ],
  },
  {
    slug: "riset-narrative-kripto-menengah",
    title: "Riset Narrative Kripto: Layer 2, RWA, dan Siklus Hype",
    mentorSlug: "salsa-maharani",
    instrument: "Crypto",
    level: "Menengah",
    thumbnailUrl: defaultCourseThumbnailPath("riset-narrative-kripto-menengah"),
    price: 950000,
    rating: 4.7,
    studentsCount: 720,
    durationHours: 5,
    shortDescription:
      "Pelajari cara mengevaluasi narrative kripto (L2, RWA, AI) tanpa terjebak hype — framework riset fundamental untuk trader menengah.",
    outcomes: [
      "Memetakan narrative panas vs fundamental proyek",
      "Menilai TVL, developer activity, dan adoption metrics",
      "Menyusun watchlist narrative dengan kriteria objektif",
      "Timing entry/exit berdasarkan fase narrative, bukan FOMO",
    ],
    modules: [
      {
        title: "Modul 1 — Framework Narrative",
        lessons: [
          { id: "l1", title: "Hype Cycle vs Adoption Curve", durationMinutes: 14, preview: true },
          { id: "l2", title: "Layer 2, RWA, AI: Apa yang Harus Dicek", durationMinutes: 18 },
        ],
      },
      {
        title: "Modul 2 — Metrik & Studi Kasus",
        lessons: [
          { id: "l3", title: "TVL, Active Addresses, GitHub Activity", durationMinutes: 19 },
          { id: "l4", title: "Studi Kasus Narrative 2024–2025", durationMinutes: 23 },
        ],
      },
      {
        title: "Modul 3 — Portfolio Narrative",
        lessons: [
          { id: "l5", title: "Alokasi Risiko per Narrative", durationMinutes: 16 },
          { id: "l6", title: "Exit Plan: Kapan Narrative Mati", durationMinutes: 15 },
        ],
      },
    ],
  },
  {
    slug: "psikologi-trading-anti-fomo",
    title: "Psikologi Trading: Mengatasi FOMO, Revenge Trade & Overconfidence",
    mentorSlug: "arif-kurniawan",
    instrument: "Saham",
    level: "Pemula",
    thumbnailUrl: defaultCourseThumbnailPath("psikologi-trading-anti-fomo"),
    price: 549000,
    rating: 4.9,
    studentsCount: 3100,
    durationHours: 4,
    shortDescription:
      "Kelas wajib sebelum naik modal — pelajari bias kognitif yang merusak akun trading dan cara membangun rutinitas mental yang konsisten.",
    outcomes: [
      "Mengenali FOMO, revenge trade, dan confirmation bias",
      "Menyusun aturan trading tertulis yang bisa dipatuhi",
      "Teknik pause & pre-mortem sebelum entry",
      "Membangun rutinitas review mingguan tanpa self-blame",
    ],
    modules: [
      {
        title: "Modul 1 — Bias yang Merusak Akun",
        lessons: [
          { id: "l1", title: "FOMO: Dari Gejala ke Penyebab", durationMinutes: 13, preview: true },
          { id: "l2", title: "Revenge Trade & Overconfidence", durationMinutes: 15 },
        ],
      },
      {
        title: "Modul 2 — Rutinitas Mental",
        lessons: [
          { id: "l3", title: "Pre-Trade Checklist Psikologis", durationMinutes: 14 },
          { id: "l4", title: "Jurnal Emosi: Template Harian", durationMinutes: 16 },
        ],
      },
      {
        title: "Modul 3 — Recovery Setelah Drawdown",
        lessons: [
          { id: "l5", title: "Protokol Setelah 3 Loss Beruntun", durationMinutes: 17 },
          { id: "l6", title: "Kapan Pause Trading — Rules of Thumb", durationMinutes: 12 },
        ],
      },
    ],
  },
  {
    slug: "blueprint-manajemen-risiko-trader",
    title: "Blueprint Manajemen Risiko: Position Sizing Lintas Saham & Forex",
    mentorSlug: "arif-kurniawan",
    instrument: "Forex",
    level: "Menengah",
    thumbnailUrl: defaultCourseThumbnailPath("blueprint-manajemen-risiko-trader"),
    price: 799000,
    rating: 4.9,
    studentsCount: 1890,
    durationHours: 5,
    shortDescription:
      "Framework position sizing dan risk-of-ruin untuk trader yang sudah punya strategi tapi belum konsisten menjaga modal.",
    outcomes: [
      "Menghitung risk per trade berdasarkan % equity",
      "Position sizing untuk saham IDX vs lot forex",
      "Simulasi drawdown maksimal yang masih bisa pulih",
      "Menyusun risk policy 1 halaman untuk diri sendiri",
    ],
    modules: [
      {
        title: "Modul 1 — Matematika Risiko",
        lessons: [
          { id: "l1", title: "Risk per Trade & Kelly Criterion (Praktis)", durationMinutes: 16, preview: true },
          { id: "l2", title: "Risk of Ruin: Kapan Akun Terancam", durationMinutes: 18 },
        ],
      },
      {
        title: "Modul 2 — Lintas Instrumen",
        lessons: [
          { id: "l3", title: "Sizing Saham IDX: Lot & Broker Fee", durationMinutes: 17 },
          { id: "l4", title: "Sizing Forex: Pip Value & Leverage", durationMinutes: 19 },
        ],
      },
      {
        title: "Modul 3 — Policy & Audit",
        lessons: [
          { id: "l5", title: "Menyusun Risk Policy Pribadi", durationMinutes: 15 },
          { id: "l6", title: "Audit Bulanan: Apakah Policy Dipatuhi?", durationMinutes: 14 },
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
  {
    name: "Budi S.",
    initials: "BS",
    rating: 5,
    comment:
      "Materi scalping Dian sangat praktis — checklist pre-market-nya langsung saya pakai di jam buka BEI.",
    date: "3 minggu lalu",
    courseTag: "Scalping Saham IDX: Setup Jam Perdagangan",
    mentorTag: "Dian Pratiwi",
  },
  {
    name: "Citra L.",
    initials: "CL",
    rating: 5,
    comment:
      "Kelas psikologi Arif membantu saya berhenti revenge trade. Fokus edukasi, bukan janji profit.",
    date: "2 minggu lalu",
    courseTag: "Psikologi Trading: Mengatasi FOMO",
    mentorTag: "Arif Kurniawan",
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

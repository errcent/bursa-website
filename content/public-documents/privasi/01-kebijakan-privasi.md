---
portal: PRIVACY
slug: kebijakan
title: Kebijakan Privasi
eyebrow: Pusat Privasi
description: Cara Bursa mengumpulkan, menggunakan, dan melindungi data pribadimu sesuai UU PDP.
sortOrder: 1
---

> **Catatan:** Dokumen ini masih **DRAFT** — wajib direview advokat berlisensi sebelum publish final.

**Bursa** ("Platform", "kami") berkomitmen melindungi privasi data pribadimu ("Pengguna", "kamu") sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (**UU PDP**). Kebijakan ini menjelaskan data apa yang kami kumpulkan, mengapa, bagaimana kami melindunginya, dan hak-hakmu sebagai subjek data.

Platform bertindak sebagai **Pengendali Data Pribadi** dan menggunakan **Prosesor Data Pribadi** pihak ketiga (hosting, payment gateway) sebagaimana dijelaskan pada Pasal 4.

## Pasal 1 — Data yang Kami Kumpulkan

| Kategori | Contoh Data | Sumber |
|----------|-------------|--------|
| **Identitas dasar** | Nama, email, nomor telepon (opsional), username | Registrasi |
| **Kredensial profesional (mentor)** | KTP, NPWP, izin OJK/Bappebti, dokumen rekam jejak | Aplikasi mentor |
| **Transaksi & finansial** | Riwayat pembelian, metode pembayaran (bukan nomor kartu), rekening bank mentor | Transaksi |
| **Perilaku belajar** | Progress kelas, catatan pribadi (Notes), watchlist | Penggunaan platform |
| **Komunikasi** | Komentar, pesan diskusi, tiket dukungan | Input pengguna |
| **Teknis** | IP, perangkat, browser, cookie, log aktivitas | Otomatis |

Login Google (opsional): email, nama tampilan, URL foto profil publik — kami tidak mengakses Gmail, kontak, atau kalender.

## Pasal 2 — Tujuan Pengumpulan Data

| Kategori | Tujuan |
|----------|--------|
| Identitas dasar | Akun, autentikasi, komunikasi transaksional |
| KYC mentor | Verifikasi kelayakan mentor — **bukan untuk pemasaran** tanpa persetujuan terpisah |
| Transaksi | Pembayaran, komisi/payout, pelaporan pajak |
| Perilaku belajar | Personalisasi rekomendasi, peningkatan kurikulum |
| Komunikasi | Moderasi, dukungan pelanggan |
| Teknis | Keamanan (deteksi anomali), analitik agregat |

**Catatan:** Notes/catatan pribadimu **privat secara default** dan tidak dibagikan ke mentor atau pihak lain tanpa izin eksplisit.

## Pasal 3 — Dasar Hukum Pemrosesan

1. **Persetujuan eksplisit** — registrasi akun dan penerimaan kebijakan (checkbox, tidak pre-checked).
2. **Pelaksanaan kontrak** — pemrosesan transaksi pembelian kelas.
3. **Kewajiban hukum** — retensi data transaksi untuk pelaporan pajak.
4. **Kepentingan sah** — deteksi penipuan dan keamanan sistem, seimbang dengan hakmu.

## Pasal 4 — Berbagi Data dengan Pihak Ketiga

Kami **tidak menjual** data pribadimu. Data dibagikan terbatas kepada:

| Pihak Ketiga | Data | Tujuan |
|--------------|------|--------|
| Payment gateway (Midtrans/Xendit) | Data transaksi | Pemrosesan pembayaran |
| Hosting (Vercel) & database cloud | Data akun terenkripsi | Infrastruktur aplikasi |
| Google OAuth | Email, profil publik | Login opsional |
| Penyedia email (Resend) | Email, nama | Notifikasi transaksional |
| Analitik (PostHog — rencana) | Data agregat/pseudonim | Peningkatan produk |
| Otoritas berwenang | Sesuai permintaan hukum sah | Kepatuuan regulasi |

Detail lengkap sub-prosesor: [Daftar Sub-prosesor](/privasi/sub-prosesor).

## Pasal 5 — Hak Subjek Data

Sesuai UU PDP, kamu berhak:

1. **Informasi** — kejelasan identitas, dasar hukum, tujuan pemrosesan.
2. **Akses** — salinan data pribadi (JSON/PDF).
3. **Koreksi** — perbaiki data tidak akurat via profil.
4. **Penghapusan** — hapus akun (dengan pengecualian data wajib retensi hukum).
5. **Tarik persetujuan** — untuk pemrosesan non-esensial.
6. **Keberatan** — atas keputusan otomatis berdampak signifikan.
7. **Pengaduan** — ke Platform atau otoritas pengawas.

Ajukan permintaan via [Form Permintaan Data](/privasi/permintaan-data) atau email [privacy@bursa.id](mailto:privacy@bursa.id). Respons maksimal **14 hari kerja**.

## Pasal 6 — Retensi Data

| Kategori | Retensi | Setelah Hapus Akun |
|----------|---------|-------------------|
| Identitas dasar | Selama akun aktif | Dihapus/dianonimkan 30–90 hari |
| KYC mentor | Masa kemitraan + kewajiban hukum | Diarsipkan sesuai hukum |
| Transaksi | Kewajiban pajak (~10 tahun) | Dianonimkan setelah periode |
| Notes & progress | Selama akun aktif | Dihapus permanen |
| Log teknis | 90–180 hari | Dihapus otomatis |

## Pasal 7 — Keamanan Data

- Enkripsi transit (TLS) dan at-rest untuk data sensitif
- RBAC — akses berbasis peran
- Audit log untuk akses data sensitif
- Kata sandi di-hash bcrypt (cost ≥ 12)
- **Tidak menyimpan data kartu** — delegasi ke payment gateway PCI-DSS

Detail keamanan: [Pusat Kepercayaan](/kepercayaan).

**Kebocoran data:** Kami akan memberitahu pengguna terdampak dan otoritas sesuai UU PDP, disertai langkah mitigasi.

## Pasal 8 — Cookie & Pelacakan

Ringkasan — detail lengkap di [Kebijakan Cookie](/privasi/cookie):

| Jenis | Fungsi | Bisa Dinonaktifkan? |
|-------|--------|---------------------|
| Esensial | Sesi login, checkout | Tidak |
| Analitik | Penggunaan fitur | Ya |
| Marketing | Kampanye iklan | Ya |

## Pasal 9 — Transfer Data Lintas Batas

Sebagian infrastruktur (Vercel, database cloud) dapat berlokasi di luar Indonesia (mis. AS, Singapura). Kami memastikan perlindungan setara melalui perjanjian dengan sub-prosesor dan kontrol kontraktual sesuai UU PDP.

## Pasal 10 — Data Anak

Platform ditujukan untuk usia **18+**. Jika kami mengetahui data anak dikumpulkan tanpa persetujuan wali, data akan dihapus segera.

## Pasal 11 — Perubahan Kebijakan

Perubahan material diberitahukan via email/notifikasi sebelum berlaku. Penggunaan berkelanjutan = persetujuan.

## Pasal 12 — Kontak

- **Email:** [privacy@bursa.id](mailto:privacy@bursa.id)
- **Dukungan umum:** [support@bursa.id](mailto:support@bursa.id)

## Pasal 13 — Data Komunitas & AI (jika fitur aktif)

Jika fitur komunitas/chat atau asisten AI diaktifkan:

| Data | Tujuan | Retensi |
|------|--------|---------|
| Pesan diskusi publik | Moderasi, dukungan komunitas | Selama akun aktif + periode moderasi |
| Log interaksi AI | Peningkatan kualitas bot dukungan | 90 hari, tanpa PII mentah di log |
| Metadata room/kelas | Organisasi diskusi per kelas | Selama enrollment aktif |

Kami **tidak** menggunakan isi Notes pribadi atau data belajar untuk melatih model AI eksternal tanpa persetujuan eksplisit terpisah.

## Pasal 14 — Pembaruan & Pemberitahuan

Perubahan material terhadap kebijakan ini akan diberitahukan melalui:

1. Email ke alamat terdaftar
2. Banner/notifikasi in-app
3. Pembarian tanggal "Terakhir diperbarui" di halaman ini

Kami menyarankan kamu meninjau kebijakan ini secara berkala. Versi terbaru selalu tersedia di [Pusat Privasi](/privasi).

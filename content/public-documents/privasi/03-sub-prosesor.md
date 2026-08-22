---
portal: PRIVACY
slug: sub-prosesor
title: Sub-prosesor
eyebrow: Pusat Privasi
description: Daftar pihak ketiga yang memproses data atas nama Bursa.
sortOrder: 3
---

_Berlaku efektif: 4 Agustus 2026_

Sub-prosesor adalah pihak ketiga yang memproses data pribadi **atas nama Bursa** untuk menjalankan layanan platform. Kami **tidak menjual** data pribadimu.

## Daftar Sub-prosesor Aktif & Direncanakan

| Sub-prosesor | Layanan | Data Diproses | Lokasi | Status |
|--------------|---------|---------------|--------|--------|
| **Vercel Inc.** | Hosting aplikasi, CDN, serverless | Data akun, log akses, metadata request | AS (global edge) | Aktif |
| **Neon / PostgreSQL cloud** | Database | Data akun, transaksi, progress | AS / EU (tergantung region) | Aktif |
| **Google LLC** | OAuth login | Email, nama, foto profil publik | AS | Aktif |
| **Midtrans / Xendit** | Payment gateway | Data transaksi, token pembayaran | Indonesia | Direncanakan |
| **Resend** | Email transaksional dan lifecycle waitlist | Email, nama (bila tersedia), preferensi topik, event delivery | AS | Aktif |
| **Cloudflare Email Routing** | Penerusan email masuk `@bursanalar.com` ke mailbox yang dipantau | Alamat, metadata SMTP, isi pesan saat di-forward | Global | Aktif (Path B2) |
| **Brevo** | Pengiriman surat manusia From `@bursanalar.com` (bukan blast waitlist) | Alamat, isi pesan keluar | EU / global | Direncanakan — aktif setelah domain terautentikasi |
| **PostHog** | Analitik produk | Data perilaku pseudonim/agregat | EU/US | Direncanakan |
| **Bunny.net / Mux** | Video streaming CDN | Metadata streaming, IP | EU/US | Direncanakan |

## Kategori Pemrosesan

### Infrastruktur
Vercel dan penyedia database cloud menjalankan aplikasi Bursa. Data disimpan terenkripsi dengan kontrol akses ketat.

### Autentikasi
Google OAuth memproses login opsional. Kami hanya menerima email dan profil publik — bukan data Google lainnya.

### Pembayaran
Payment gateway memproses transaksi. **Bursa tidak menyimpan nomor kartu** — semua data kartu ditangani oleh gateway bersertifikasi PCI-DSS.

### Komunikasi
Resend mengirim notifikasi transaksional (misalnya reset password) dan lifecycle waitlist sesuai persetujuan eksplisit. Status opt-out, bounce, dan complaint disinkronkan agar kiriman berikutnya dihentikan. Email marketing waitlist dikelola terpisah dari email keamanan dan transaksi akun.

Mailbox manusia (`esakaisar@`, `support@`, `privacy@`, `security@`) masuk via **Cloudflare Email Routing** ke inbox yang dipantau, dan keluar via SMTP terautentikasi (**Brevo**) agar From brand lolos DMARC. Stream ini terpisah dari Resend.

### Analitik
Data analitik dipseudonimkan/agregatkan untuk meningkatkan produk — bukan untuk profil individu yang dijual.

## Perubahan Sub-prosesor

Kami akan memperbarui daftar ini saat menambah atau mengganti sub-prosesor. Perubahan material akan diberitahukan via email atau notifikasi platform.

Untuk keberatan atas sub-prosesor baru, hubungi [privacy@bursanalar.com](mailto:privacy@bursanalar.com) dengan subjek "Keberatan Sub-prosesor".

## Hubungan dengan Trust Center

Detail kontrol keamanan sub-prosesor: [Pusat Kepercayaan — Keamanan](/kepercayaan/keamanan).

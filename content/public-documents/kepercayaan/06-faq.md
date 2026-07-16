---
portal: TRUST
slug: faq
title: FAQ Keamanan
eyebrow: Pusat Kepercayaan
description: Pertanyaan umum seputar keamanan dan kepatuhan platform Bursa.
sortOrder: 6
---

> **Catatan:** Dokumen ini masih **DRAFT** — wajib direview advokat sebelum publish final.

## Apakah Bursa tersertifikasi SOC 2 atau ISO 27001?

**Belum.** Sertifikasi ini dalam roadmap kami. Saat ini kami menerapkan kontrol keamanan best-practice (TLS, bcrypt, RBAC) dan transparan tentang status implementasi. Lihat [Kontrol Keamanan](/kepercayaan/kontrol).

## Apakah Bursa aman untuk data pribadiku?

Kami menerapkan enkripsi transit (TLS), hashing password (bcrypt), kontrol akses berbasis peran, dan prinsip privacy by design. Platform masih dalam tahap prototype lanjutan — beberapa kontrol production (MFA admin, field encryption) masih dalam pengembangan.

## Apakah admin Bursa bisa melihat catatan belajarku?

**Tidak.** Notes/catatan pribadi pelajar 100% privat — tidak accessible oleh admin, mentor, atau pihak manapun. Lihat [Kontrol Keamanan](/kepercayaan/kontrol).

## Bagaimana Bursa melindungi data pembayaran?

Kami **tidak menyimpan** nomor kartu. Pembayaran diproses oleh payment gateway (Midtrans/Xendit) bersertifikasi PCI-DSS. Bursa hanya menerima metadata transaksi (jumlah, status).

## Apakah Bursa perlu izin OJK?

Sebagai platform **edukasi** (bukan broker/PUJK), Bursa tidak memerlukan izin Penyedia Jasa Keuangan. Namun kami wajib patuh POJK 6/2026 sebagai penyampai informasi edukasi keuangan. Detail: [Kepatuhan](/kepercayaan/kepatuhan).

## Bagaimana cara melaporkan celah keamanan?

Email [security@bursa.id](mailto:security@bursa.id) dengan deskripsi, langkah reproduksi, dan dampak potensial. Kami commit respond dalam 3 hari kerja. Detail: [Pelaporan Kerentanan](/kepercayaan/pelaporan).

## Apakah ada bug bounty program?

**Belum tersedia** saat ini. Kami pertimbangkan setelah launch publik dan penetration test eksternal.

## Di mana data disimpan secara fisik?

Infrastruktur cloud (Vercel untuk hosting, PostgreSQL cloud untuk database) dapat berlokasi di AS atau region terdekat. Daftar sub-prosesor: [/privasi/sub-prosesor](/privasi/sub-prosesor).

## Apa yang terjadi jika ada kebocoran data?

Kami akan: (1) contain insiden, (2) notify otoritas dalam 3×24 jam sesuai UU PDP, (3) notify pengguna terdampak, (4) post-mortem dan perbaikan.

## Apakah Bursa compliant dengan UU PDP?

Kami dalam proses implementasi penuh — kontrol dasar sudah aktif (TLS, bcrypt, RBAC, privacy policy). Endpoint export/delete data dan DPO formal direncanakan pre-launch. Detail: [Kepatuhan](/kepercayaan/kepatuhan).

## Siapa sub-prosesor Bursa?

Vercel (hosting), PostgreSQL cloud (database), Google (OAuth), dan payment gateway (rencana). Daftar lengkap: [/privasi/sub-prosesor](/privasi/sub-prosesor).

## Bagaimana mentor diverifikasi?

Mentor melalui KYC — verifikasi KTP, NPWP, dan lisensi OJK/Bappebti. Dokumen KYC dienkripsi dan hanya accessible compliance reviewer. Kurikulum ditinjau tim sebelum tayang.

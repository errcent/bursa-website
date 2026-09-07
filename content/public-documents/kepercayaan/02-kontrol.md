---
portal: TRUST
slug: kontrol
title: Kontrol Keamanan
eyebrow: Pusat Kepercayaan
description: Matriks kontrol keamanan teknis dan organisasional Bursa.
sortOrder: 2
---

_Berlaku efektif: 22 Juli 2026_

Matriks ini versi publik â€” detail teknis internal tidak dipublikasikan demi keamanan.

## Kontrol Teknis

| Kontrol | Deskripsi | Status |
|---------|-----------|--------|
| **TLS 1.2+** | Enkripsi semua komunikasi client-server | âœ“ |
| **bcrypt password** | Hash kata sandi cost â‰¥ 12 | âœ“ |
| **RBAC** | Role-based access control di API & admin | âœ“ |
| **Rate limiting** | Throttle endpoint auth & API | âœ“ |
| **CSRF protection** | Token pada form sensitif | ~ |
| **Input validation** | Zod schema di API routes | âœ“ |
| **SQL injection prevention** | Prisma ORM parameterized queries | âœ“ |
| **XSS prevention** | React auto-escape + DOMPurify | âœ“ |
| **Audit logging** | Log akses data sensitif | ~ |
| **Field encryption** | KYC/bank columns at-rest | â€” |

## Kontrol Organisasional

| Kontrol | Deskripsi | Status |
|---------|-----------|--------|
| **Access review** | Review akses admin berkala | â€” |
| **Incident response plan** | SOP kebocoran data | âœ“ (internal) |
| **Vendor assessment** | Review sub-prosesor | ~ |
| **Security training** | Onboarding engineer | âœ“ |
| **Change management** | PR review untuk kode sensitif | âœ“ |

## Matriks Akses Admin (Versi Publik)

Prinsip: admin **tidak boleh** melihat data privat pelajar.

| Data | Admin | Support | Compliance |
|------|-------|---------|------------|
| Email user | ~ Masked | ~ Masked | ~ Masked |
| Nama lengkap | ~ Partial | ~ Partial | ~ Partial |
| No. telepon | Ã- | Ã- | Ã- |
| Password/hash | Ã- | Ã- | Ã- |
| Kartu pembayaran | Ã- | Ã- | Ã- |
| Notes pelajar | Ã- | Ã- | Ã- |
| Progress (detail) | ~ Agregat | âœ“ Support | Ã- |
| KYC mentor | Ã- | Ã- | âœ“ Review |
| Transaksi metadata | âœ“ | âœ“ Billing | Ã- |
| IP log | âœ“ Security | Ã- | Ã- |

**Legenda:** âœ“ = akses terbatas Â· ~ = masked/agregat Â· Ã- = hard deny Â· â€” = rencana

## Break-Glass (Pengecualian)

| Situasi | Akses | Kontrol |
|---------|-------|---------|
| Investigasi fraud | Metadata transaksi | Ticket + audit log |
| Review KYC mentor | Dokumen terenkripsi | Alasan tercatat, expiry 24 jam |
| Permintaan hukum | Sesuai surat resmi | Dokumentasi lengkap |

> **Tidak ada pengecualian** untuk membaca Notes pribadi pelajar.

## Roadmap Kontrol

1. MFA wajib untuk admin (Q3 2026)
2. Field-level encryption KYC (Q3 2026)
3. Penetration test eksternal (pre-launch)
4. SOC 2 readiness assessment (2027)

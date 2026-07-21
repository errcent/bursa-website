---
portal: TRUST
slug: kontrol
title: Kontrol Keamanan
eyebrow: Pusat Kepercayaan
description: Matriks kontrol keamanan teknis dan organisasional Bursa.
sortOrder: 2
---

_Berlaku efektif: 22 Juli 2026_

Matriks ini versi publik — detail teknis internal tidak dipublikasikan demi keamanan.

## Kontrol Teknis

| Kontrol | Deskripsi | Status |
|---------|-----------|--------|
| **TLS 1.2+** | Enkripsi semua komunikasi client-server | ✅ |
| **bcrypt password** | Hash kata sandi cost ≥ 12 | ✅ |
| **RBAC** | Role-based access control di API & admin | ✅ |
| **Rate limiting** | Throttle endpoint auth & API | ✅ |
| **CSRF protection** | Token pada form sensitif | 🔄 |
| **Input validation** | Zod schema di API routes | ✅ |
| **SQL injection prevention** | Prisma ORM parameterized queries | ✅ |
| **XSS prevention** | React auto-escape + DOMPurify | ✅ |
| **Audit logging** | Log akses data sensitif | 🔄 |
| **Field encryption** | KYC/bank columns at-rest | 📋 |

## Kontrol Organisasional

| Kontrol | Deskripsi | Status |
|---------|-----------|--------|
| **Access review** | Review akses admin berkala | 📋 |
| **Incident response plan** | SOP kebocoran data | ✅ (internal) |
| **Vendor assessment** | Review sub-prosesor | 🔄 |
| **Security training** | Onboarding engineer | ✅ |
| **Change management** | PR review untuk kode sensitif | ✅ |

## Matriks Akses Admin (Versi Publik)

Prinsip: admin **tidak boleh** melihat data privat pelajar.

| Data | Admin | Support | Compliance |
|------|-------|---------|------------|
| Email user | ⚠️ Masked | ⚠️ Masked | ⚠️ Masked |
| Nama lengkap | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial |
| No. telepon | ❌ | ❌ | ❌ |
| Password/hash | ❌ | ❌ | ❌ |
| Kartu pembayaran | ❌ | ❌ | ❌ |
| Notes pelajar | ❌ | ❌ | ❌ |
| Progress (detail) | ⚠️ Agregat | ✅ Support | ❌ |
| KYC mentor | ❌ | ❌ | ✅ Review |
| Transaksi metadata | ✅ | ✅ Billing | ❌ |
| IP log | ✅ Security | ❌ | ❌ |

**Legenda:** ✅ = akses terbatas | ⚠️ = masked/agregat | ❌ = hard deny

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

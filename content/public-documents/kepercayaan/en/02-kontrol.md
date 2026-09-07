---
portal: TRUST
slug: kontrol
locale: en
title: Security controls
eyebrow: Trust Center
description: Public matrix of Bursaâ€™s technical and organisational security controls.
sortOrder: 2
---

_Effective: 22 July 2026_

If the Indonesian and English versions differ, **the Indonesian version governs.**

This matrix is the public version â€” internal technical detail is not published for security reasons.

## Technical controls

| Control | Description | Status |
|---------|-----------|--------|
| **TLS 1.2+** | Encrypt all client-server communication | âœ“ |
| **bcrypt password** | Password hash cost â‰¥ 12 | âœ“ |
| **RBAC** | Role-based access control on API and admin | âœ“ |
| **Rate limiting** | Throttle auth and API endpoints | âœ“ |
| **CSRF protection** | Tokens on sensitive forms | ~ |
| **Input validation** | Zod schema on API routes | âœ“ |
| **SQL injection prevention** | Prisma ORM parameterized queries | âœ“ |
| **XSS prevention** | React auto-escape + DOMPurify | âœ“ |
| **Audit logging** | Logs of access to sensitive data | ~ |
| **Field encryption** | KYC/bank columns at rest | â€” |

## Organisational controls

| Control | Description | Status |
|---------|-----------|--------|
| **Access review** | Periodic review of admin access | â€” |
| **Incident response plan** | Data-leak SOP | âœ“ (internal) |
| **Vendor assessment** | Subprocessor review | ~ |
| **Security training** | Engineer onboarding | âœ“ |
| **Change management** | PR review for sensitive code | âœ“ |

## Admin access matrix (public version)

Principle: admins **must not** see private learner data.

| Data | Admin | Support | Compliance |
|------|-------|---------|------------|
| User email | ~ Masked | ~ Masked | ~ Masked |
| Full name | ~ Partial | ~ Partial | ~ Partial |
| Phone number | Ã- | Ã- | Ã- |
| Password/hash | Ã- | Ã- | Ã- |
| Payment card | Ã- | Ã- | Ã- |
| Learner Notes | Ã- | Ã- | Ã- |
| Progress (detail) | ~ Aggregate | âœ“ Support | Ã- |
| Mentor KYC | Ã- | Ã- | âœ“ Review |
| Transaction metadata | âœ“ | âœ“ Billing | Ã- |
| IP log | âœ“ Security | Ã- | Ã- |

**Legend:** âœ“ = limited access Â· ~ = masked/aggregate Â· Ã- = hard deny Â· â€” = planned

## Break-glass (exceptions)

| Situation | Access | Control |
|---------|-------|---------|
| Fraud investigation | Transaction metadata | Ticket + audit log |
| Mentor KYC review | Encrypted documents | Recorded reason, 24-hour expiry |
| Legal request | As in the official letter | Full documentation |

> **No exception** for reading a learnerâ€™s private Notes.

## Control roadmap

1. Mandatory admin MFA (Q3 2026)
2. KYC field-level encryption (Q3 2026)
3. External penetration test (pre-launch)
4. SOC 2 readiness assessment (2027)

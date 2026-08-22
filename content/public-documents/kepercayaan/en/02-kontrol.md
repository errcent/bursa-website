---
portal: TRUST
slug: kontrol
locale: en
title: Security controls
eyebrow: Trust Center
description: Public matrix of Bursa’s technical and organisational security controls.
sortOrder: 2
---

_Effective: 22 July 2026_

If the Indonesian and English versions differ, **the Indonesian version governs.**

This matrix is the public version — internal technical detail is not published for security reasons.

## Technical controls

| Control | Description | Status |
|---------|-----------|--------|
| **TLS 1.2+** | Encrypt all client-server communication | ✓ |
| **bcrypt password** | Password hash cost ≥ 12 | ✓ |
| **RBAC** | Role-based access control on API and admin | ✓ |
| **Rate limiting** | Throttle auth and API endpoints | ✓ |
| **CSRF protection** | Tokens on sensitive forms | ~ |
| **Input validation** | Zod schema on API routes | ✓ |
| **SQL injection prevention** | Prisma ORM parameterized queries | ✓ |
| **XSS prevention** | React auto-escape + DOMPurify | ✓ |
| **Audit logging** | Logs of access to sensitive data | ~ |
| **Field encryption** | KYC/bank columns at rest | — |

## Organisational controls

| Control | Description | Status |
|---------|-----------|--------|
| **Access review** | Periodic review of admin access | — |
| **Incident response plan** | Data-leak SOP | ✓ (internal) |
| **Vendor assessment** | Subprocessor review | ~ |
| **Security training** | Engineer onboarding | ✓ |
| **Change management** | PR review for sensitive code | ✓ |

## Admin access matrix (public version)

Principle: admins **must not** see private learner data.

| Data | Admin | Support | Compliance |
|------|-------|---------|------------|
| User email | ~ Masked | ~ Masked | ~ Masked |
| Full name | ~ Partial | ~ Partial | ~ Partial |
| Phone number | × | × | × |
| Password/hash | × | × | × |
| Payment card | × | × | × |
| Learner Notes | × | × | × |
| Progress (detail) | ~ Aggregate | ✓ Support | × |
| Mentor KYC | × | × | ✓ Review |
| Transaction metadata | ✓ | ✓ Billing | × |
| IP log | ✓ Security | × | × |

**Legend:** ✓ = limited access · ~ = masked/aggregate · × = hard deny · — = planned

## Break-glass (exceptions)

| Situation | Access | Control |
|---------|-------|---------|
| Fraud investigation | Transaction metadata | Ticket + audit log |
| Mentor KYC review | Encrypted documents | Recorded reason, 24-hour expiry |
| Legal request | As in the official letter | Full documentation |

> **No exception** for reading a learner’s private Notes.

## Control roadmap

1. Mandatory admin MFA (Q3 2026)
2. KYC field-level encryption (Q3 2026)
3. External penetration test (pre-launch)
4. SOC 2 readiness assessment (2027)

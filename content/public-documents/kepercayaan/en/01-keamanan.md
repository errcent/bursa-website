---
portal: TRUST
slug: keamanan
locale: en
title: Security program
eyebrow: Trust Center
description: Summary of Bursa’s information-security program — principles, architecture, and operational practice.
sortOrder: 1
---

_Effective: 22 July 2026_

If the Indonesian and English versions differ, **the Indonesian version governs.**

Bursa’s security program applies technical and organisational best-practice controls. Formal certification (SOC 2, ISO 27001) is on the roadmap; each control’s implementation status is described honestly on this page.

## Fundamental principles

| Principle | Implementation |
|---------|--------------|
| **Least privilege** | Each admin role only accesses the minimum data for its task |
| **Data minimisation** | Collect only what education and payment require |
| **Encryption in transit** | TLS 1.2+ on all endpoints |
| **Encryption at rest** | Sensitive columns (KYC, bank accounts) encrypted in the database |
| **Purpose limitation** | Mentor KYC is not used for marketing without consent |
| **Accountability** | Audit logs for access to sensitive data |
| **Privacy by design** | PII masking in the admin panel from MVP |

## Security architecture

```
User → TLS → Vercel Edge → Next.js App → RBAC API → PostgreSQL (encrypted)
                                    ↓
                              Payment Gateway (PCI delegated)
```

### Authentication
- Passwords hashed with **bcrypt** (cost ≥ 12)
- Password reset: hashed token, single-use, 30-minute expiry
- Optional Google OAuth — minimal scope (email + public profile)
- Rate limiting on auth and sensitive API endpoints

### Payments
- **No card data stored** — fully delegated to Midtrans/Xendit
- Minimal PCI scope (SAQ A) when hosted payment page is active

### Video & content
- Video access is enrolment-based — not a public URL
- Content protection: redistribution forbidden (Terms)

## Specially protected data

| Data | Protection |
|------|--------------|
| Learner Notes | 100% private — admins cannot access |
| Mentor KYC | Encrypted at rest, compliance-only access |
| Password | bcrypt hash — never plaintext |
| Session tokens | HttpOnly cookies (production target) |
| Payment card | Never stored |

## Implementation status

| Control | Status |
|---------|--------|
| TLS everywhere | ✓ Active (Vercel) |
| Password hashing | ✓ Active |
| Admin RBAC | ✓ Active |
| Admin PII masking | ~ Partial |
| KYC field encryption | ~ Planned |
| Admin MFA | — Roadmap |
| Penetration test | — Pre-launch |

## Incidents & response

If a data leak occurs, we will:
1. Contain and assess within 24 hours
2. Notify authorities under UU PDP (3×24 hours)
3. Notify affected users
4. Post-mortem and remediation

Detail: [Vulnerability reporting](/en/report).

## Infrastructure & vendors

| Layer | Provider | Notes |
|-------|----------|---------|
| Hosting & CDN | Vercel | Edge TLS, basic DDoS mitigation |
| Database | PostgreSQL (Neon/cloud) | Encryption at rest by the provider |
| OAuth | Google | Minimal scope |
| Video (planned) | Bunny.net / Mux | Signed URLs, enrolment-gated |

Vendor detail: [Subprocessors](https://privacy.bursanalar.com/en/subprocessors).

## Contact

Security: [security@bursanalar.com](mailto:security@bursanalar.com)

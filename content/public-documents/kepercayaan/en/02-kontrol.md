---
portal: TRUST
slug: kontrol
locale: en
title: Security controls
eyebrow: Trust Center
description: Public matrix of technical and organisational controls. Internal detail is withheld on purpose.
sortOrder: 2
---

_Effective: 22 July 2026_

**If the Indonesian and English versions conflict, the Indonesian version governs.**

## Technical

TLS 1.2+, bcrypt, RBAC, rate limiting, Zod validation, Prisma parameterized queries, XSS escaping: **active**. CSRF hardening, audit logging, field-level KYC encryption: **partial / planned**.

## Organisational

Incident-response SOP and PR review for sensitive code: **active**. Periodic access review: **planned**.

## Admin access (public version)

Admins **must not** see private learner data. Email/name masked; phone, password hashes, cards, and Notes: **deny**. No break-glass for Notes.

## Roadmap

Admin MFA, KYC field encryption, external pentest pre-launch, SOC 2 readiness (not a current claim).

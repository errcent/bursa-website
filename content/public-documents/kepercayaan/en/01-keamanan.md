---
portal: TRUST
slug: keamanan
locale: en
title: Security program
eyebrow: Trust Center
description: Information-security program — principles, architecture, and operational practice.
sortOrder: 1
---

_Effective: 22 July 2026_

**If the Indonesian and English versions conflict, the Indonesian version governs.** Formal SOC 2 / ISO 27001 are on the roadmap; each control’s status is listed honestly.

## Principles

Least privilege, data minimisation, TLS 1.2+, encryption at rest for sensitive columns, purpose limitation for mentor KYC, audit logs, privacy by design (PII masking in admin).

## Architecture (summary)

User → TLS → Vercel Edge → Next.js → RBAC API → encrypted PostgreSQL. Payments go to a PCI-certified gateway; Bursa does not store cards.

Passwords: bcrypt (cost ≥ 12). Reset tokens hashed, single-use, 30 minutes. Optional Google OAuth with minimal scopes. Rate limits on auth.

Video access is enrollment-gated, not a public URL.

## Specially protected data

Learner Notes: **no admin access**. Mentor KYC: encrypted, compliance-only. Session cookies: HttpOnly, **host-only** (admin origin is separate).

## Incidents

Contain and assess within 24 hours; notify authorities under UU PDP (3×24 hours); notify affected users; post-mortem. See [vulnerability reporting](/en/report).

security@bursanalar.com

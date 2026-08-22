---
portal: PRIVACY
slug: sub-prosesor
locale: en
title: Subprocessors
eyebrow: Privacy Center
description: Third parties that process personal data on Bursa’s behalf.
sortOrder: 3
---

_Effective: 4 August 2026_

If the Indonesian and English versions differ, **the Indonesian version governs.**

Subprocessors are third parties that process personal data **on Bursa’s behalf** to run the platform. We **do not sell** your personal data.

## Active and planned subprocessors

| Subprocessor | Service | Data processed | Location | Status |
|--------------|---------|---------------|--------|--------|
| **Vercel Inc.** | App hosting, CDN, serverless | Account data, access logs, request metadata | US (global edge) | Active |
| **Neon / PostgreSQL cloud** | Database | Account, transaction, progress data | US / EU (region-dependent) | Active |
| **Google LLC** | OAuth login | Email, name, public profile photo | US | Active |
| **Midtrans / Xendit** | Payment gateway | Transaction data, payment tokens | Indonesia | Planned |
| **Resend** | Transactional and waitlist-lifecycle email | Email, name (if available), topic preferences, delivery events | US | Active |
| **Cloudflare Email Routing** | Forwarding inbound `@bursanalar.com` to a monitored mailbox | Address, SMTP metadata, message body when forwarded | Global | Active (Path B2) |
| **Brevo** | Human outbound mail From `@bursanalar.com` (not waitlist blast) | Address, outbound message body | EU / global | Planned — active after domain authentication |
| **PostHog** | Product analytics | Pseudonymous/aggregate behaviour | EU/US | Planned |
| **Bunny.net / Mux** | Video streaming CDN | Streaming metadata, IP | EU/US | Planned |

## Processing categories

### Infrastructure
Vercel and the cloud database run the Bursa application. Data is stored encrypted with strict access control.

### Authentication
Google OAuth processes optional login. We receive only email and the public profile — not other Google data.

### Payments
The payment gateway processes transactions. **Bursa does not store card numbers** — all card data is handled by a PCI-DSS certified gateway.

### Communications
Resend sends transactional notices (for example password reset) and waitlist lifecycle mail based on explicit consent. Opt-out, bounce, and complaint status are synced so later sends stop. Waitlist marketing email is managed separately from security and account-transaction email.

Human mailboxes (`esakaisar@`, `support@`, `privacy@`, `security@`) inbound via **Cloudflare Email Routing** to a monitored inbox, and outbound via authenticated SMTP (**Brevo**) so branded From addresses pass DMARC. This stream is separate from Resend.

### Analytics
Analytics data is pseudonymised/aggregated to improve the product — not to sell individual profiles.

## Subprocessor changes

We will update this list when we add or replace a subprocessor. Material changes will be notified by email or platform notification.

To object to a new subprocessor, contact [privacy@bursanalar.com](mailto:privacy@bursanalar.com) with subject “Subprocessor objection”.

## Relation to the Trust Center

Subprocessor security controls: [Trust Center — Security](https://trust.bursanalar.com/en/security).

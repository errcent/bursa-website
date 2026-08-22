---
portal: TRUST
slug: faq
locale: en
title: Security FAQ
eyebrow: Trust Center
description: Common questions about security and compliance on the Bursa platform.
sortOrder: 6
---

_Effective: 22 July 2026_

If the Indonesian and English versions differ, **the Indonesian version governs.**

## Is Bursa SOC 2 or ISO 27001 certified?

**Not yet.** These certifications are on our roadmap. We currently apply security best-practice controls (TLS, bcrypt, RBAC) and are transparent about implementation status. See [Security controls](/en/controls).

## Is Bursa safe for my personal data?

We apply encryption in transit (TLS), password hashing (bcrypt), role-based access control, and privacy by design. Further controls (admin MFA, full field encryption) are still being improved — see [Security controls](/en/controls) for current status.

## Can Bursa admins see my learning notes?

**No.** Learner Notes/private notes are 100% private — not accessible by admins, mentors, or anyone else. See [Security controls](/en/controls).

## How does Bursa protect payment data?

We **do not store** card numbers. Payments are processed by a PCI-DSS certified payment gateway (Midtrans/Xendit). Bursa only receives transaction metadata (amount, status).

## Does Bursa need an OJK licence?

As an **education** platform (not a broker/PUJK), Bursa does not require a financial-services-provider licence. We must still comply with POJK 6/2026 as a publisher of financial-education information. Detail: [Compliance](/en/compliance).

## How do I report a security issue?

Email [security@bursanalar.com](mailto:security@bursanalar.com) with a description, reproduction steps, and potential impact. We commit to respond within 3 working days. Detail: [Vulnerability reporting](/en/report).

## Is there a bug-bounty program?

**Not available** yet. We will consider it after public launch and an external penetration test.

## Where is data stored physically?

Cloud infrastructure (Vercel for hosting, cloud PostgreSQL for the database) may be located in the US or a nearby region. Subprocessor list: [Subprocessors](https://privacy.bursanalar.com/en/subprocessors).

## What happens if there is a data leak?

We will: (1) contain the incident, (2) notify authorities within 3×24 hours under UU PDP, (3) notify affected users, (4) post-mortem and remediate.

## Is Bursa compliant with UU PDP?

We are in full implementation — baseline controls are already active (TLS, bcrypt, RBAC, privacy policy). Data export/delete endpoints and a formal DPO are planned pre-launch. Detail: [Compliance](/en/compliance).

## Who are Bursa’s subprocessors?

Vercel (hosting), cloud PostgreSQL (database), Google (OAuth), and a payment gateway (planned). Full list: [Subprocessors](https://privacy.bursanalar.com/en/subprocessors).

## How are mentors verified?

Mentors go through KYC — ID card, tax ID, and OJK/Bappebti licences. KYC documents are encrypted and accessible only to the compliance reviewer. Curriculum is reviewed by the team before going live.

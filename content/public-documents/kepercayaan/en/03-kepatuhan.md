---
portal: TRUST
slug: kepatuhan
locale: en
title: Regulatory compliance
eyebrow: Trust Center
description: Bursa’s compliance with UU PDP, POJK 6/2026, and industry security standards.
sortOrder: 3
---

_Effective: 22 July 2026_

If the Indonesian and English versions differ, **the Indonesian version governs.**

## Platform regulatory position

Bursa is a **trading-education platform** operated under **PT Global Makmur Madani** — not a financial-services provider (PUJK), broker, or investment adviser. We provide learning infrastructure, not trade execution or personalised investment recommendations. Day-to-day management of Bursanalar is by Raden Mohammad Kaisar Khan and Fakhri Muzakki.

## Law No. 27/2022 — Personal Data Protection

| Aspect | Bursa implementation |
|-------|-------------------|
| Personal-data controller | PT Global Makmur Madani as controller |
| Legal bases for processing | Consent, contract, legal obligation, legitimate interest |
| Data-subject rights | Request form + privacy@bursanalar.com |
| Data security | TLS, bcrypt, RBAC, audit log |
| Breach notification | SOP 3×24 hours to authorities + users |
| DPO | Internal responsible person (also compliance reviewer) |

Detail: [Privacy Policy](https://privacy.bursanalar.com/en/policies).

## POJK No. 6/2026 — Finfluencers & financial education

| Duty | Implementation |
|-----------|--------------|
| No guaranteed profit | Disclaimer in Terms, mentor content review |
| Education is not a recommendation | Platform scope = structured education |
| Mentor verification | KYC + OJK/Bappebti licences checked before going live |
| Content compliance | Curriculum review before publication |

The Platform **does not require** an OJK PUJK licence because it is not a financial-services offering — but it must still comply as a publisher of financial-education information.

## POJK No. 13/2025 — Securities recommendations

Specific buy/sell recommendations require an active Investment Adviser (PI) licence. Bursa:
- **Does not** provide platform-level investment recommendations
- Mentors who give specific recommendations must hold a PI licence
- A Signal feature (if enabled) is only from PI-licensed mentors

## PCI-DSS (payments)

- Bursa **does not store** card data (PAN, CVV)
- Processing via a PCI-DSS certified payment gateway
- Target scope: SAQ A (hosted payment page)

## GDPR-ready

Although the primary focus is UU PDP, we apply GDPR-compatible principles:
- Data minimisation
- Privacy by design
- Right to erasure
- Data portability (JSON export)

Relevant if the platform accepts international users.

## PSE (Electronic System Operator)

Kominfo PSE registration is planned before full-scale public launch.

## Pre-launch checklist

- [ ] ToS & Privacy Policy final (counsel review)
- [ ] Mentor Agreement signed
- [ ] PSE registered
- [ ] Payment gateway merchant active
- [ ] POJK 6/2026 content policy enforced
- [ ] DPO designated
- [ ] Penetration test completed

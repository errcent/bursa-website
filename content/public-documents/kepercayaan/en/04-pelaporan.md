---
portal: TRUST
slug: pelaporan
locale: en
title: Vulnerability reporting
eyebrow: Trust Center
description: Bursa’s responsible-disclosure policy — how to report a security issue safely.
sortOrder: 4
---

_Effective: 22 July 2026_

If the Indonesian and English versions differ, **the Indonesian version governs.**

We value the security community’s help in keeping Bursa safe. If you find a security vulnerability, report it responsibly.

## Responsible disclosure

### What to report

- Security issues in the Bursa web application (bursanalar.com / bursanalar.vercel.app)
- Weaknesses in authentication, authorisation, or injection
- Data exposure that should not occur
- Misconfiguration that exposes sensitive data

### What not to report here

- Spam/phishing (report to support@bursanalar.com)
- Non-security UI/UX bugs (report to support@bursanalar.com)
- Personal-data privacy complaints (use [Data requests](https://privacy.bursanalar.com/en/requests))

## How to report

Email **[security@bursanalar.com](mailto:security@bursanalar.com)** with:

1. **Vulnerability description** — in detail
2. **Reproduction steps** — step-by-step so we can verify
3. **Potential impact** — which data/functions are affected
4. **Proof of concept** — screenshot or PoC (do not exploit real user data)
5. **Your contact** — for follow-up

## What we promise

| Commitment | Detail |
|----------|--------|
| **Acknowledgement** | Confirm receipt within 3 working days |
| **Assessment** | Severity evaluation within 7 working days |
| **Fix timeline** | Communicate a remediation timeline by severity |
| **No retaliation** | We will not pursue researchers who follow this policy |
| **Recognition** | Credit (if you want it) after the fix is verified |

## Scope & limits

### In scope
- `*.bursanalar.com`, `bursanalar.vercel.app`
- Public API endpoints
- Authentication & authorisation

### Out of scope
- Social engineering / phishing
- DoS/DDoS attacks
- Physical security
- Third-party vulnerabilities (report to the vendor)

## Prohibitions

- **Do not** access, modify, or delete other users’ data
- **Do not** exploit a vulnerability beyond verification
- **Do not** publish before we fix (coordinated disclosure)
- **Do not** use automated scanners that overload the system

## Data incidents (leaks)

If you find evidence of an active data leak:
1. Report immediately to security@bursanalar.com
2. Do not download/archive user data
3. We will activate the incident-response plan

## Bug bounty

A bug-bounty program is **not available** yet. We will consider it after public launch and an external penetration test.

## Contact

- **Security:** [security@bursanalar.com](mailto:security@bursanalar.com)
- **PGP key:** Available on request

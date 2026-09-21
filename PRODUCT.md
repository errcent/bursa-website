# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Indonesian retail traders and investors who already study on Bursanalar and need a private journal for what they actually did, not another public feed.

Situation: after a session, at a desk or on a phone, they must log an execution or a belief before memory rewrites it.

Job: answer one of six section questions (where am I, what did I do, what am I allowed to do, what should I change, what shock is coming, what am I exploring) without mixing those jobs.

Inferred from repo: mentors and apex marketing visitors are not the Note user. Lesson-player Notes are a different product.

## Product Purpose

Bursa Note is a private Trade & Invest journal on `https://note.bursanalar.com`. Success is habit: a trader can log a trade in 20-40 seconds (`cepat`) and later deepen it (`review`, `klinik`) without retyping. It is not a broker, not a signal desk, and not the course-player note pad.

## Positioning

Section-isolated decision journal: each nav item owns one decision function (Overview / Journal / Playbook / Analytics / News / Notes + Track for invest holdings). Neighboring journals can log PnL; they cannot claim this six-function split plus Bursanalar education isolation (separate Note DB, no public win-rate, no mentor read).

## Operating Context

- Host: `note.bursanalar.com`. Local: `http://localhost:3000/note`. Apex `/note/*` 308s to the Note host.
- Open-access preview until 2026-10-01 WIB (`preview@note.bursanalar.com`). After that, apex SSO.
- Demo sample trades appear until the user logs their own.
- Habit-first: no Note paywall, no Midtrans on this surface, no public leaderboard.
- CSV import is the current sync path. Broker API sync is not MVP.

## Capabilities and Constraints

Confirmed:

- Routes: Overview, Journal, Playbook, Analytics, News, Notes (`/note/catatan`), Track, Baru, Impor, Setelan, Profil.
- Entry kinds: `TRADE` (journal) vs invest ledger (Track). Modes: `cepat` | `review` | `klinik`.
- Isolated Prisma schema (`Website/prisma-note`), APIs under `/api/note/*` on the Note host only.
- Locale ID/EN via Note prefs. Default chrome is dark (`data-note-theme="dark"`) with a light remap in `note-theme.css`.
- `robots: noindex, nofollow` on Note pages.

Must not:

- Promise profit, signals, or investment advice.
- Position Bursa as broker / IB / PUJK.
- Mix Bursa Note with lesson Notes.
- Use em dash in user-facing Website copy. Empty values: `-`.

Undecided (do not invent): paid Note Plus, AI trait "Pro" claims, broker password sync.

## Brand Commitments

- Product name: **Bursa Note**. Voice Style C: Trade & Invest as journal actions, not order execution.
- Legal: not investment advice, not a broker. Indonesian governs if ID/EN conflict.
- Apex brand fonts: headings DM Sans, body Inter. Note chrome currently uses zinc Tailwind utilities on a near-black shell, not the apex marketing hero.
- Binding references: `Documentation/Produk/Fitur/05 - Bursa Note (Jurnal Trade & Invest).md`, `Documentation/Produk/Spec/16 - Voice Trade & Invest (SSOT).md`.

## Evidence on Hand

- Live host: `https://note.bursanalar.com` (open-access preview).
- Implementation: `Website/src/app/note/`, `Website/src/components/note/`, `Website/src/lib/note/`.
- Demo journal: `Website/src/lib/note/demo-entries.ts`.
- No fabricated testimonials, win-rates, or broker partnerships.

## Product Principles

1. One section, one decision. Do not merge Journal narrative into Analytics or News into Playbook.
2. Habit before lock. Fast capture beats complete diagnosis.
3. Private by default. No public stats, no mentor journal read.
4. Evidence, not promises. Numbers are the user's log or clearly labeled demo.
5. Education journal, not a dealing desk.

## Accessibility & Inclusion

No product-specific WCAG contract is written for Note. Treat WCAG AA (contrast 4.5:1, 44px touch targets, labeled controls, keyboard) as the QA floor until Legal/Product set a stricter bar. Light theme remaps zinc utilities; both themes must stay readable.

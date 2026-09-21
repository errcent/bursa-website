---
name: Bursa Note
description: Private Trade & Invest journal chrome on note.bursanalar.com
colors:
  bg: "#09090b"
  bg-raised: "#18181b"
  text: "#f4f4f5"
  text-muted: "#a1a1aa"
  text-faint: "#52525b"
  border: "#27272a"
  accent: "#8b93a7"
  up: "#34d399"
  up-strong: "#10b981"
  down: "#fb7185"
  down-strong: "#f43f5e"
  warn: "#fbbf24"
  info: "#38bdf8"
  apex-bg: "#000000"
  apex-fg: "#ededed"
typography:
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  heading:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.06em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "14px"
spacing:
  chrome: "16px"
  section: "12px"
  stack: "8px"
components:
  note-shell:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
    padding: "0"
  sidebar-link:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
    padding: "8px 10px"
  sidebar-link-active:
    backgroundColor: "{colors.bg-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "8px 10px"
  pnl-up:
    textColor: "{colors.up}"
  pnl-down:
    textColor: "{colors.down}"
---

## Overview

Bursa Note is an operate-mode product: a full-viewport dark journal (zinc-950 shell, no apex marketing navbar). Brand steel `#8b93a7` is secondary. Semantic color is reserved for PnL and risk (emerald up, rose down, amber warn, sky info) via `note-theme.css` and `chart-colors.ts`.

Light theme exists as a utility remap (`[data-note-theme="light"]`) but the shipped default in `note-shell.tsx` is `data-note-theme="dark"`.

## Colors

- Canvas: near-black zinc (`#09090b` / `#18181b`), not the apex pure `#000` hero.
- Type: zinc-100 body, zinc-400 secondary, zinc-600 section labels.
- Accent: slate-steel `#8b93a7` inherited from apex tokens. Do not introduce purple gradients or glow-for-glow's-sake.
- Semantic: `--chart-up` `#34d399`, `--chart-down` `#fb7185`, `--chart-warn` `#fbbf24`, `--chart-info` `#38bdf8`. Surfaces mix those hues at 6-35% opacity.

## Typography

- Apex system: headings **DM Sans**, body **Inter** (`globals.css`).
- Note UI is mostly 14px Inter-like sans via Tailwind `text-sm`. Section eyebrows are 10px uppercase.
- Page titles live in the 56px header, not a display face.
- User-facing copy: no em dash. Style C verbs (Trade / Invest) on actions. Empty value glyph is `-`.

## Layout

- App chrome: `h-dvh` column. Header 56px, then sidebar + main. Main scrolls; shell does not.
- Sidebar: primary six sections, hairline, then Invest / Track. Active = raised zinc-900 + zinc-50.
- Content pad: `px-4 sm:px-6 lg:px-8`.
- Mobile: hamburger header; sidebar becomes a sheet. Touch targets on nav links are ~36px tall today (flag if under 44px).

## Elevation & Depth

Mostly flat. Separation is 1px `border-zinc-800/80` and a 40% zinc-900 strip for preview/demo notices. No heavy drop shadows, no neon glow. Apex atom-card shadows do not belong inside Note.

## Shapes

- Nav and notices: `rounded-md` / `rounded-lg` (6-8px).
- Apex marketing radius (`--radius` 0.875rem / 14px) is for apex cards, not Note rows.
- Charts and heat cells stay rectangular / slightly rounded; do not pill every metric.

## Components

- **Shell**: logo, page title, locale/theme/help, profile. Preview/demo strip under title when open-access or demo data is on.
- **Sidebar**: text links only, no icons required. `aria-current="page"` on the active item.
- **Journal / forms**: dense tables and inputs. Primary action is log/save, not decorate.
- **PnL**: `.note-pnl-up` / `.note-pnl-down` only. Do not color entire pages green/red.
- **Surfaces**: `.note-surface-up|down|warn` for insight chips, never as page chrome.

## Do's and Don'ts

Do:

- Keep one H1-equivalent title per section and the section question as the subline.
- Label demo numbers as sample trades.
- Preserve dark-first zinc + semantic PnL colors.

Don't:

- Add apex navbar/footer or marketing grain overlays on the Note host.
- Promise returns, signals, or broker execution.
- Nest cards in cards or use purple/blue AI-slop gradients.
- Mix lesson Notes UI into this journal.

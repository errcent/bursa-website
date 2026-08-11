# Visual Audit Report — 2026-08-11

**Target:** `https://bursanalar.vercel.app` → resolves to `https://bursanalar.com`  
**Viewports:** desktop 1440×900 · mobile 390×844  
**Auth:** none (`PLAYWRIGHT_AUTH_*` unset) — gated routes marked **Incomplete**  
**Artifacts:** `e2e/screenshots/{desktop,mobile}/*.png` · `e2e/reports/meta-*.json`

## Executive verdict

Surface publik sudah punya arah dark minimal yang tenang, tapi **belum premium-elegan**. Masalah sistemik terbesar: **section `Reveal`/`Stagger` start di `opacity: 0`** — konten di bawah lipatan terlihat seperti “black hole” sampai di-scroll (dan freeze di screenshot). CTA primer memakai **gradient slate→navy** (bukan gold brand brief) — sudah intentional post QC-04, tapi glow cookie/nav masih terasa “AI blue”. Cookie banner mendominasi first viewport di hampir semua page.

## Rubric (1–5, fail ≤3)

| Page | Comp | Type | Space | Color | Trust | Mobile | Empty | Console | Verdict | Pri |
|---|---|---|---|---|---|---|---|---|---|---|
| `/tentang-kami` | 2 | 3 | **1** | 3 | 3 | 2 | 2 | 5 | **Hard-fail** | P0 |
| `/jadi-mentor` | 2 | 3 | **1** | 3 | 3 | 2 | 3 | 5 | **Hard-fail** | P0 |
| `/pengaturan` | 2 | 3 | 3 | 3 | — | 3 | **2** | 5 | **Hard-fail** | P0 |
| `/dashboard` | — | — | — | — | — | — | — | 5 | **Incomplete** (login wall) | P0* |
| `/profil` | — | — | — | — | — | — | — | 5 | **Incomplete** (login wall) | P0* |
| `/lab` | 4 | 4 | 4 | 3 | 4 | 4 | 4 | 5 | Soft-fail | P1 |
| `/bantuan` | 3 | 4 | 3 | 3 | 4 | 3 | 3 | 5 | Soft-fail | P1 |
| `/privasi` | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 5 | Soft-fail | P1 |
| `/kepercayaan` | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 5 | Soft-fail | P1 |
| `/syarat-dan-ketentuan` | 3 | 3 | 3 | 3 | 4 | 3 | 4 | 5 | Soft-fail | P1 |
| `/masuk` `/daftar` | 4 | 4 | 4 | 3 | 4 | 4 | 4 | 5 | Soft-fail | P2 |
| `/` katalog kelas | 4 | 4 | 3 | 3 | 4 | 3 | 4 | 5 | Soft-fail | P2 |
| Lab tools ×16 | 4 | 4 | 4 | 3 | 4 | 4 | 4 | 5 | Soft-fail | P2 |

\*P0* = butuh auth env untuk audit penuh; guest redirect ke `/masuk` sudah benar secara flow.

## Temuan kritis (jujur)

### P0-1 — Motion Reveal = konten “hilang”
`Reveal` / `Stagger` memakai `initial={{ opacity: 0 }}` + `whileInView`. Section About (Misi & Visi → CTA), mentor (Requirements → Process), dll. **tetap menempati tinggi layout tapi invisible** sampai IO fire. Full-page shot = void hitam besar. Ini merusak kepercayaan premium lebih dari font/spacing.

### P0-2 — Pengaturan signed-out: chrome mati
Sidebar tab Akun/Perangkat/Pembayaran tetap hidup di samping kartu “Masuk/Daftar”. Terasa seperti app rusak, bukan empty state yang dirancang.

### P0-3 — Cookie banner intrusive
Fixed bar penuh lebar + dua CTA di hampir setiap first viewport. Mengalahkan hero page info/legal.

### P0-4 — Card fatigue (About / Jadi Mentor / Portal)
Grid `surface-card` berulang (icon-in-rounded-box) membuat marketing page terasa template SaaS, bukan editorial institusional.

### P1 — Portal trust masih “markdown + kartu”
Hub privasi/kepercayaan: body MD lalu grid dokumen. Institusional, tapi tidak elegan; icon low-contrast; panel “Butuh bantuan?” berulang di setiap doc.

### P1 — Lab & Bantuan inkonsisten
Lab sudah lebih kuat (list rows). Bantuan masih pill filter + accordion long gap sebelum footer.

### Incomplete — Dashboard / Profil / Pengaturan authenticated
Tanpa `PLAYWRIGHT_AUTH_EMAIL/PASSWORD`, audit hanya melihat login wall / signed-out. Re-run dengan creds wajib.

## Polish order (eksekusi)

1. Harden `Reveal`/`Stagger` (visible fallback + viewport lebih forgiving) — **done**
2. Settings signed-out tanpa dead nav — **done**
3. Compact cookie banner — **done**
4. About + Jadi Mentor: kurangi card chrome, rapatkan rhythm — **done**
5. Portal hub cards → list editorial lebih tenang — **done**
6. Re-capture priority routes — **done (local localhost:3000)**

## Post-polish re-capture (local)

Re-run 18 priority shots (desktop+mobile) against `http://localhost:3000` after code fixes:

| Page | Before (prod) | After (local) |
|---|---|---|
| `/tentang-kami` | Hard-fail — black hole | **Pass** — all sections visible, editorial lists |
| `/jadi-mentor` | Hard-fail — black hole | **Pass** — requirements/process/FAQ visible |
| `/pengaturan` | Hard-fail — dead tab nav | **Pass** — clean signed-out CTA |
| `/privasi` `/kepercayaan` | Soft-fail card grid | Soft-fail→improved editorial hub links |
| Cookie banner | Intrusive on every shot | Dismissed via `bursa-cookie-consent` init script |

### P1 wave (local re-capture)

| Page | Change |
|---|---|
| `/bantuan` | lab-search + lab-pill; empty/support tanpa surface-card |
| `/lab` | InfoPageHero + skenario divider (bukan 3-col cards) |
| `/syarat-dan-ketentuan` | TOC + help panel editorial |
| `/privasi` `/kepercayaan` | cross-link + help panel border-t |

### P2 wave (local)

| Area | Change |
|---|---|
| Auth `/masuk` `/daftar` | `.auth-card` lebih ringan (tanpa shadow berat) |
| Lab tool pages | “Tool terkait” editorial border-t |
| Dashboard empty | editorial divider, bukan surface-card |
| Profil / Tersimpan | hero konsisten + form tanpa card; `container-page` |

**Deploy note:** Fixes are in `Website/src/` only. Production masih menampilkan versi lama sampai deploy.

## Capture notes

- Desktop prod: 66/66 captured  
- Mobile prod: 66/66 after forcing Chromium (iPhone device preset required WebKit, not installed)  
- Priority re-capture local: 18/18 passed  
- Soft asserts: console pageerrors bersih di meta samples yang dicek  

/** SSOT brand asset paths and UI slot dimensions (see Brand Asset Checklist). */

export const BRAND_ASSETS = {
  productNav: "/brand/logo_product_bursa_navbar.png",
  wordmark: "/brand/logo_wordmark_bursanalar.png",
  lockupHorizontal: "/brand/logo_lockup_horizontal.png",
  lockupStacked: "/brand/logo_lockup_stacked.png",
  lockupStackedLight: "/brand/logo_lockup_stacked_light.png",
  iconMark: "/brand/logo_icon_mark.png",
  emailHeaderDark: "/brand/web_email_header_dark.png",
  emailHeaderLight: "/brand/web_email_header_light.png",
  ogDefault: "/og/default.png",
  ogTwitter: "/og/twitter.png",
} as const;

export const BRAND_SLOTS = {
  productNavDesktop: { w: 118, h: 25, src: BRAND_ASSETS.productNav, ratio: 4.8 },
  productNavMobile: { w: 100, h: 21, src: BRAND_ASSETS.productNav, ratio: 4.8 },
  productFooter: { w: 128, h: 27, src: BRAND_ASSETS.productNav, ratio: 4.8 },
  productAdmin: { w: 96, h: 20, src: BRAND_ASSETS.productNav, ratio: 4.8 },
  wordmarkPreloader: { w: 176, h: 24, src: BRAND_ASSETS.wordmark, ratio: 1000 / 136 },
  productPreloaderDesktop: { w: 200, h: 42, src: BRAND_ASSETS.productNav, ratio: 4.8 },
  productPreloaderMobile: { w: 168, h: 35, src: BRAND_ASSETS.productNav, ratio: 4.8 },
  lockupStackedAuth: { w: 131, h: 40, src: BRAND_ASSETS.lockupStacked, ratio: 657 / 200 },
  lockupHorizontalFooter: { w: 342, h: 40, src: BRAND_ASSETS.lockupHorizontal, ratio: 1711 / 200 },
} as const;

export type BrandSlotKey = keyof typeof BRAND_SLOTS;

export function brandSlot(key: BrandSlotKey) {
  return BRAND_SLOTS[key];
}

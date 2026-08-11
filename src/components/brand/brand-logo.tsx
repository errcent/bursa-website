import Image from "next/image";

import { type BrandSlotKey, brandSlot } from "@/lib/brand/assets";
import { cn } from "@/lib/utils";

export type BrandLogoVariant = "product" | "wordmark" | "lockup-h" | "lockup-s";

const VARIANT_SLOT: Record<
  BrandLogoVariant,
  BrandSlotKey | { desktop: BrandSlotKey; mobile?: BrandSlotKey }
> = {
  product: { desktop: "productNavDesktop", mobile: "productNavMobile" },
  wordmark: "wordmarkPreloader",
  "lockup-h": "lockupHorizontalFooter",
  "lockup-s": "lockupStackedAuth",
};

type BrandLogoProps = {
  variant: BrandLogoVariant;
  /** Override slot key (e.g. productAdmin, productFooter). */
  slot?: BrandSlotKey;
  priority?: boolean;
  className?: string;
  /** Decorative when inside a labeled link. */
  decorative?: boolean;
};

export function BrandLogo({
  variant,
  slot,
  priority = false,
  className,
  decorative = false,
}: BrandLogoProps) {
  const mapping = VARIANT_SLOT[variant];
  const desktopKey =
    slot ?? (typeof mapping === "string" ? mapping : mapping.desktop);
  const mobileKey =
    slot ?? (typeof mapping === "object" ? (mapping.mobile ?? mapping.desktop) : mapping);

  const desktop = brandSlot(desktopKey);
  const mobile = brandSlot(mobileKey);

  const alt = decorative ? "" : "Bursa";

  if (desktopKey === mobileKey || desktop.w === mobile.w) {
    return (
      <Image
        src={desktop.src}
        alt={alt}
        width={desktop.w}
        height={desktop.h}
        priority={priority}
        unoptimized={desktop.src.endsWith(".svg")}
        className={cn("h-auto w-auto max-w-none shrink-0", className)}
        style={{ width: desktop.w, height: desktop.h }}
      />
    );
  }

  return (
    <>
      <Image
        src={mobile.src}
        alt={alt}
        width={mobile.w}
        height={mobile.h}
        priority={priority}
        unoptimized={mobile.src.endsWith(".svg")}
        className={cn("h-auto w-auto max-w-none shrink-0 sm:hidden", className)}
        style={{ width: mobile.w, height: mobile.h }}
      />
      <Image
        src={desktop.src}
        alt={alt}
        width={desktop.w}
        height={desktop.h}
        priority={priority}
        unoptimized={desktop.src.endsWith(".svg")}
        className={cn("hidden h-auto w-auto max-w-none shrink-0 sm:block", className)}
        style={{ width: desktop.w, height: desktop.h }}
      />
    </>
  );
}

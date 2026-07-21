import type { ReactNode } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

const appStoreUrl =
  process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() || "/waitlist";
const googlePlayUrl =
  process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL?.trim() || "/waitlist";

const BADGE_WIDTH = "7.48rem";
const appleBadgeClass = "h-10 w-[7.48rem] object-contain object-left";
const googleBadgeClass = "h-10 w-[7.48rem] object-cover object-left";

function StoreBadgeLink({
  href,
  label,
  children,
  external,
}: {
  href: string;
  label: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : undefined)}
      aria-label={label}
      className="inline-flex h-10 w-[7.48rem] items-center justify-start transition-opacity hover:opacity-90"
      style={{ width: BADGE_WIDTH }}
    >
      {children}
    </a>
  );
}

export function AppDownloadBadges({ className }: { className?: string }) {
  const appStoreExternal = appStoreUrl.startsWith("http");
  const googlePlayExternal = googlePlayUrl.startsWith("http");

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <h4 className="font-heading text-sm font-medium">Download</h4>
      <div className="flex flex-col items-start gap-2">
        <StoreBadgeLink
          href={appStoreUrl}
          label="Unduh Bursa di App Store"
          external={appStoreExternal}
        >
          {/* Official Apple App Store badge (Apple Media Services API) */}
          <img
            src="/badges/app-store.svg"
            alt="Unduh di App Store"
            width={120}
            height={40}
            className={appleBadgeClass}
          />
        </StoreBadgeLink>
        <StoreBadgeLink
          href={googlePlayUrl}
          label="Unduh Bursa di Google Play"
          external={googlePlayExternal}
        >
          {/* Official Google Play badge asset */}
          <Image
            src="/badges/google-play.png"
            alt="Unduh di Google Play"
            width={646}
            height={250}
            className={googleBadgeClass}
          />
        </StoreBadgeLink>
      </div>
    </div>
  );
}

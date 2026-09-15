"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { NoteQuickPrefs } from "@/components/note/note-quick-prefs";
import { useAuth } from "@/components/auth-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isProductionHostRouting, originFor } from "@/lib/hosts/hosts";
import { isNoteOpenAccessPeriod } from "@/lib/note/open-access";
import { noteCopy } from "@/lib/note/copy";
import type { DisplayCurrency, NoteLocale } from "@/lib/note/prefs";
import { noteApexLoginHref } from "@/lib/note/sso-urls";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

export function NoteProfileMenuContent() {
  const { session, logout, isLoading } = useAuth();
  const router = useRouter();
  const [prefs, update] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const loginHref = noteApexLoginHref("/note");
  const apexProfil = isProductionHostRouting() ? `${originFor("apex")}/profil` : "/profil";
  const openAccess = isNoteOpenAccessPeriod();

  if (isLoading) {
    return <p className="px-2 py-3 text-xs text-zinc-500">{copy.profil}</p>;
  }

  const patchLocale = (locale: NoteLocale) => update({ locale });
  const patchCurrency = (currency: DisplayCurrency) => update({ currency });
  const patchUsdIdr = (usdIdrRate: number) =>
    update({ usdIdrRate, usdIdrRateManual: true, usdIdrRateFetchedAt: undefined });
  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel className="font-normal">
          <p className="text-[11px] text-zinc-500">{copy.accountEmail}</p>
          <p className="truncate text-sm text-zinc-100">
            {session?.email ??
              (openAccess
                ? prefs.locale === "en"
                  ? "Preview (no login)"
                  : "Preview (tanpa login)"
                : copy.belumMasuk)}
          </p>
        </DropdownMenuLabel>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuLabel>{prefs.locale === "en" ? "Preferences" : "Preferensi"}</DropdownMenuLabel>
        <div className="px-2 pb-2">
          <NoteQuickPrefs
            locale={prefs.locale}
            currency={prefs.currency}
            usdIdrRate={prefs.usdIdrRate}
            onLocale={patchLocale}
            onCurrency={patchCurrency}
            onUsdIdrRate={patchUsdIdr}
            copy={copy}
            compact
          />
        </div>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      {session ? (
        <>
          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link href="/note/profil" />}>{copy.profil}</DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/note/setelan" />}>{copy.setelan}</DropdownMenuItem>
            <DropdownMenuItem render={<a href={apexProfil} />}>{copy.bursaAccount}</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                void logout().then(() => router.replace(loginHref));
              }}
            >
              {copy.keluar}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </>
      ) : openAccess ? null : (
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href={loginHref} />}>{copy.masuk}</DropdownMenuItem>
        </DropdownMenuGroup>
      )}
    </>
  );
}

export function NoteProfileMenu({ trigger }: { trigger: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-zinc-600 rounded-md"
        aria-label="Profil dan preferensi"
      >
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" sideOffset={8} className="z-50 w-72">
        <NoteProfileMenuContent />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

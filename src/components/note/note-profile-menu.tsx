"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isProductionHostRouting, originFor } from "@/lib/hosts/hosts";
import { noteCopy } from "@/lib/note/copy";
import type { DisplayCurrency, NoteLocale, NoteTheme } from "@/lib/note/prefs";
import { noteApexLoginHref } from "@/lib/note/sso-urls";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

function Selected({ on }: { on: boolean }) {
  return on ? (
    <span className="ml-auto text-zinc-400" aria-hidden>
      ✓
    </span>
  ) : null;
}

export function NoteProfileMenu() {
  const { session, logout, isLoading } = useAuth();
  const router = useRouter();
  const [prefs, update] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const loginHref = noteApexLoginHref("/note");
  const apexProfil = isProductionHostRouting() ? `${originFor("apex")}/profil` : "/profil";

  if (isLoading) {
    return <span className="text-xs text-zinc-500">{copy.profil}</span>;
  }

  if (!session) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-md px-2 py-1 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white">
          {copy.profil}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <p className="text-[11px] text-zinc-500">{copy.accountEmail}</p>
            <p className="truncate text-sm text-zinc-100">{copy.belumMasuk}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href={loginHref} />}>{copy.masuk}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-md px-2 py-1 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white">
        {copy.profil}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <p className="text-[11px] text-zinc-500">{copy.accountEmail}</p>
          <p className="truncate text-sm text-zinc-100">{session.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/note/profil" />}>{copy.profil}</DropdownMenuItem>
        <DropdownMenuItem render={<a href={apexProfil} />}>{copy.bursaAccount}</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>{copy.language}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => update({ locale: "id" as NoteLocale })}>
              Indonesia
              <Selected on={prefs.locale === "id"} />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => update({ locale: "en" as NoteLocale })}>
              English
              <Selected on={prefs.locale === "en"} />
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>{copy.currency}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {(["IDR", "USD", "USDT"] as DisplayCurrency[]).map((currency) => (
              <DropdownMenuItem key={currency} onClick={() => update({ currency })}>
                {currency}
                <Selected on={prefs.currency === currency} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>{copy.theme}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {(
              [
                ["dark", copy.themeDark],
                ["light", copy.themeLight],
                ["system", copy.themeSystem],
              ] as [NoteTheme, string][]
            ).map(([theme, label]) => (
              <DropdownMenuItem key={theme} onClick={() => update({ theme })}>
                {label}
                <Selected on={prefs.theme === theme} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void logout().then(() => router.replace(loginHref));
          }}
        >
          {copy.keluar}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

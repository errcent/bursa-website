"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { NoteLoadingLine } from "@/components/note/note-loading-line";
import { noteCopy } from "@/lib/note/copy";
import { isProductionHostRouting, originFor } from "@/lib/hosts/hosts";
import { noteApexLoginHref } from "@/lib/note/sso-urls";
import { useNotePrefs } from "@/lib/note/use-note-prefs";

export function NoteProfilePage() {
  const { session, logout, isLoading } = useAuth();
  const router = useRouter();
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const apexProfil = isProductionHostRouting() ? `${originFor("apex")}/profil` : "/profil";
  const loginHref = noteApexLoginHref("/note");

  if (isLoading) {
    return <NoteLoadingLine />;
  }

  if (!session) {
    return (
      <div className="max-w-md space-y-4">
        <p className="text-sm leading-relaxed text-zinc-400">
          {prefs.locale === "en"
            ? "Sign in with your Bursa account to sync journal entries across devices."
            : "Masuk dengan akun Bursa agar jurnal tersinkron antar perangkat."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={loginHref}
            className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md bg-zinc-100 px-3.5 text-sm font-semibold text-zinc-950 hover:bg-white"
          >
            {copy.masuk}
          </Link>
          <Link
            href="/note/setelan"
            className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md border border-zinc-700 px-3.5 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            {copy.setelan}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-6">
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs text-zinc-500">{copy.accountEmail}</dt>
          <dd className="text-zinc-100">{session.email}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">{prefs.locale === "en" ? "Name" : "Nama"}</dt>
          <dd className="text-zinc-100">{session.name || "-"}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <a
          href={apexProfil}
          className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md border border-zinc-700 px-3.5 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          {copy.bursaAccount}
        </a>
        <Link
          href="/note/setelan"
          className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md border border-zinc-700 px-3.5 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          {copy.setelan}
        </Link>
        <button
          type="button"
          className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md px-3.5 text-sm text-rose-300 hover:bg-zinc-900"
          onClick={() => {
            void logout().then(() => router.replace(loginHref));
          }}
        >
          {copy.keluar}
        </button>
      </div>
    </div>
  );
}

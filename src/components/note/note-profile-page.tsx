"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
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
    return <p className="text-sm text-zinc-500">…</p>;
  }

  if (!session) {
    return (
      <p className="text-sm text-zinc-400">
        {copy.contoh}{" "}
        <Link href={loginHref} className="text-zinc-200 hover:underline">
          {copy.masuk}
        </Link>
      </p>
    );
  }

  return (
    <div className="max-w-md space-y-6">
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-[11px] text-zinc-500">{copy.accountEmail}</dt>
          <dd className="text-zinc-100">{session.email}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-zinc-500">{prefs.locale === "en" ? "Name" : "Nama"}</dt>
          <dd className="text-zinc-100">{session.name || "—"}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-3 text-sm">
        <a href={apexProfil} className="text-zinc-300 hover:text-white">
          {copy.bursaAccount}
        </a>
        <Link href="/note/setelan" className="text-zinc-300 hover:text-white">
          {copy.setelan}
        </Link>
        <button
          type="button"
          className="text-rose-400 hover:text-rose-300"
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

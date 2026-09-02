import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { originFor } from "@/lib/hosts/hosts";

export function NoteShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const catalogHref = originFor("apex");
  const helpHref = `${originFor("apex")}/bantuan`;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/note" className="flex items-center gap-2.5" aria-label="Bursa Note">
            <BrandLogo variant="product" decorative className="h-7 w-auto" />
            <span className="font-heading text-sm font-semibold tracking-wide text-zinc-200">
              Note
            </span>
          </Link>
          <a
            href={catalogHref}
            className="text-xs text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-200 hover:underline"
          >
            Katalog Bursa
          </a>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </header>
        {children}
        <p className="mt-14 text-xs leading-relaxed text-zinc-500">
          Jurnal privat, bersifat edukatif — bukan rekomendasi investasi. Bukan catatan lesson di
          kelas.{" "}
          <a href={helpHref} className="underline-offset-4 hover:text-zinc-300 hover:underline">
            Bantuan
          </a>
        </p>
      </main>
    </div>
  );
}

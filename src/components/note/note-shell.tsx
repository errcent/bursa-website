import Link from "next/link";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";

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
  return (
    <>
      <SiteNavbar />
      <main className="flex-1 overflow-x-clip">
        <div className="container-page section-tight pb-16 pt-6 sm:pt-8">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow mb-2">Bursa Note</p>
              <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
              {description ? (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </header>
          {children}
          <p className="lab-disclaimer mt-12">
            Jurnal ini privat dan bersifat edukatif, bukan rekomendasi investasi. Lesson Notes di kelas
            berbeda dari Bursa Note.{" "}
            <Link href="/bantuan" className="underline-offset-4 hover:underline">
              Bantuan
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

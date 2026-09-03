"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { NoteJournalProvider } from "@/components/note/note-journal-context";
import { NoteKindProvider } from "@/components/note/note-kind-context";
import { NoteProfileMenu } from "@/components/note/note-profile-menu";
import { NoteSidebar } from "@/components/note/note-sidebar";
import { isProductionHostRouting, originFor } from "@/lib/hosts/hosts";
import { noteCopy } from "@/lib/note/copy";
import { resolveNoteTheme } from "@/lib/note/prefs";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

import "./note-theme.css";

const chromePad = "px-4 sm:px-6 lg:px-8";

function NoteShellInner({ title, children }: { title?: ReactNode; children: ReactNode }) {
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prefersDark, setPrefersDark] = useState(true);
  const helpHref = isProductionHostRouting() ? `${originFor("apex")}/bantuan` : "/bantuan";

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDark(mq.matches);
    const onChange = () => setPrefersDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const theme = resolveNoteTheme(prefs.theme, prefersDark);

  return (
    <div
      data-note-theme={theme}
      className={cn(
        "flex min-h-full flex-1 flex-col",
        theme === "light" ? "bg-zinc-50 text-zinc-900" : "bg-zinc-950 text-zinc-100"
      )}
    >
      <header className="border-b border-zinc-800/80">
        <div className={`flex h-14 w-full items-center justify-between gap-3 ${chromePad}`}>
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="note-mobile-panel"
              onClick={() => setMenuOpen(true)}
            >
              {copy.menu}
            </button>
            <Link href="/note" className="flex shrink-0 items-center gap-2 sm:gap-2.5" aria-label="Bursa Note">
              <BrandLogo variant="product" decorative />
              <span className="hidden h-4 w-px bg-zinc-700 sm:block" aria-hidden />
              <span className="font-heading text-sm font-semibold tracking-wide">Note</span>
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <a href={helpHref} className="text-sm text-zinc-400 hover:text-zinc-100">
              {copy.support}
            </a>
            <NoteProfileMenu />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-zinc-800/80 lg:block xl:w-64">
          <NoteSidebar />
        </aside>

        {menuOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/60"
              aria-label={copy.tutup}
              onClick={() => setMenuOpen(false)}
            />
            <aside
              id="note-mobile-panel"
              className="relative z-10 flex h-full w-64 min-h-0 flex-col border-r border-zinc-800 bg-zinc-950"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-3 py-3">
                <span className="text-sm text-zinc-300">Note</span>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  onClick={() => setMenuOpen(false)}
                >
                  {copy.tutup}
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <NoteSidebar onNavigate={() => setMenuOpen(false)} />
              </div>
            </aside>
          </div>
        ) : null}

        <main className={`min-w-0 flex-1 ${chromePad} py-6 sm:py-8`}>
          {title ? (
            <h1 className="mb-8 font-heading text-xl font-semibold tracking-tight">{title}</h1>
          ) : null}
          {children}
        </main>
      </div>

      <div
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
      >
        <p
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-center text-xs font-medium shadow-lg backdrop-blur-sm",
            theme === "light"
              ? "border-amber-300/80 bg-amber-50/95 text-amber-950"
              : "border-amber-500/40 bg-amber-950/90 text-amber-100"
          )}
        >
          {copy.underDev}
        </p>
      </div>
    </div>
  );
}

export function NoteShell({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <NoteKindProvider>
      <NoteJournalProvider>
        <NoteShellInner title={title}>{children}</NoteShellInner>
      </NoteJournalProvider>
    </NoteKindProvider>
  );
}

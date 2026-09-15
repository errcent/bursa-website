"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { NoteJournalOnboarding } from "@/components/note/note-journal-onboarding";
import { NoteJournalProvider, useNoteJournal } from "@/components/note/note-journal-context";
import { NoteAiAssistant } from "@/components/note/note-ai-assistant";
import { NoteSidebar } from "@/components/note/note-sidebar";
import { isProductionHostRouting, originFor } from "@/lib/hosts/hosts";
import { noteCopy } from "@/lib/note/copy";
import { needsNoteJournalOnboarding } from "@/lib/note/prefs";
import { useUsdIdrRateSync } from "@/lib/note/fx/use-usd-idr-sync";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

import "./note-theme.css";

const chromePad = "px-4 sm:px-6 lg:px-8";

function NotePublicStatusStrip() {
  const journal = useNoteJournal();
  const [prefs] = useNotePrefs();
  const locale = prefs.locale;
  if (journal.loading) return null;

  const parts: string[] = [];
  if (journal.openAccess) {
    parts.push(
      locale === "en"
        ? "Preview until 1 Oct 2026 (no Bursa login required)."
        : "Preview sampai 1 Okt 2026 (tanpa login Bursa)."
    );
  }
  if (journal.demo) {
    parts.push(
      locale === "en"
        ? "Journal numbers include sample trades until you log your own."
        : "Angka jurnal memakai contoh trade sampai kamu log sendiri."
    );
  }
  if (!parts.length) return null;

  return (
    <p className="mb-4 rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2 text-xs leading-snug text-zinc-400">
      {parts.join(" ")}
    </p>
  );
}

function NoteShellInner({ title, children }: { title?: ReactNode; children: ReactNode }) {
  const [prefs, updatePrefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useUsdIdrRateSync();

  useEffect(() => {
    setShowOnboarding(needsNoteJournalOnboarding());
  }, []);
  const helpHref = isProductionHostRouting() ? `${originFor("apex")}/bantuan` : "/bantuan";

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div
      data-note-theme="dark"
      className={cn("flex h-dvh min-h-0 flex-col overflow-hidden", "bg-zinc-950 text-zinc-100")}
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
          <a href={helpHref} className="shrink-0 text-sm text-zinc-400 hover:text-zinc-100">
            {copy.support}
          </a>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-60 shrink-0 self-stretch border-r border-zinc-800/80 lg:flex lg:min-h-0 lg:flex-col xl:w-64">
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
              <div className="flex min-h-0 flex-1 flex-col">
                <NoteSidebar onNavigate={() => setMenuOpen(false)} />
              </div>
            </aside>
          </div>
        ) : null}

        <main className={`min-h-0 min-w-0 flex-1 overflow-y-auto ${chromePad} py-5 sm:py-7`}>
          {title ? (
            <h1 className="mb-4 font-heading text-xl font-semibold tracking-tight text-zinc-100 sm:mb-5">
              {title}
            </h1>
          ) : null}
          <NotePublicStatusStrip />
          {children}
        </main>
      </div>

      <NoteAiAssistant />

      {showOnboarding ? (
        <NoteJournalOnboarding
          locale={prefs.locale}
          currency={prefs.currency}
          onComplete={(patch) => {
            updatePrefs(patch);
            setShowOnboarding(false);
          }}
        />
      ) : null}
    </div>
  );
}

export function NoteShell({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <NoteJournalProvider>
      <NoteShellInner title={title}>{children}</NoteShellInner>
    </NoteJournalProvider>
  );
}

"use client";

import Link from "next/link";
import { Menu, PanelLeft, PanelLeftClose } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { NoteJournalOnboarding } from "@/components/note/note-journal-onboarding";
import { NoteJournalDbProvider } from "@/components/note/note-journal-db-context";
import { NoteJournalProvider } from "@/components/note/note-journal-context";
import { NoteAiAssistant } from "@/components/note/note-ai-assistant";
import { NoteSidebar } from "@/components/note/note-sidebar";
import { isProductionHostRouting, originFor } from "@/lib/hosts/hosts";
import { noteCopy } from "@/lib/note/copy";
import { needsNoteJournalOnboarding, resolveNoteTheme, type NoteTheme } from "@/lib/note/prefs";
import { useUsdIdrRateSync } from "@/lib/note/fx/use-usd-idr-sync";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

import "./note-theme.css";

const SIDEBAR_KEY = "note-sidebar-open-v1";

function useResolvedNoteTheme(theme: NoteTheme): "dark" | "light" {
  const [prefersDark, setPrefersDark] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setPrefersDark(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return resolveNoteTheme(theme, prefersDark);
}

function useSidebarOpen(): [boolean, (open: boolean) => void] {
  const [open, setOpenState] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SIDEBAR_KEY);
      if (raw === "0") setOpenState(false);
      if (raw === "1") setOpenState(true);
    } catch {
      /* ignore */
    }
  }, []);

  function setOpen(next: boolean) {
    setOpenState(next);
    try {
      window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  return [open, setOpen];
}

const chromePad = "px-4 sm:px-6 lg:px-8";

function NoteShellInner({ title, children }: { title?: ReactNode; children: ReactNode }) {
  const [prefs, updatePrefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const theme = useResolvedNoteTheme(prefs.theme);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useSidebarOpen();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuWasOpen = useRef(false);

  useUsdIdrRateSync();

  useEffect(() => {
    setShowOnboarding(needsNoteJournalOnboarding());
  }, []);
  const helpHref = isProductionHostRouting() ? `${originFor("apex")}/bantuan` : "/bantuan";

  useEffect(() => {
    if (!menuOpen) {
      if (menuWasOpen.current) menuButtonRef.current?.focus();
      menuWasOpen.current = false;
      return;
    }
    menuWasOpen.current = true;
    const panel = document.getElementById("note-mobile-panel");
    const focusable = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
            )
          )
        : [];
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusable();
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div
      data-note-theme={theme}
      className={cn(
        "flex h-dvh min-h-0 flex-col overflow-hidden",
        "bg-zinc-950 text-zinc-100",
        "pt-[env(safe-area-inset-top)]"
      )}
    >
      <a href="#note-main" className="note-skip">
        {copy.skipToContent}
      </a>
      <header className="border-b border-zinc-800/80">
        <div className={`flex h-14 w-full items-center justify-between gap-3 ${chromePad}`}>
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <button
              ref={menuButtonRef}
              type="button"
              className="inline-flex min-h-9 coarse:min-h-11 min-w-9 coarse:min-w-11 items-center justify-center rounded-md px-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="note-mobile-panel"
              aria-label={copy.menu}
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              className="hidden min-h-9 coarse:min-h-11 min-w-9 coarse:min-w-11 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 lg:inline-flex"
              aria-pressed={!sidebarOpen}
              aria-controls="note-desktop-sidebar"
              aria-label={sidebarOpen ? copy.hideSidebar : copy.showSidebar}
              title={sidebarOpen ? copy.hideSidebar : copy.showSidebar}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="size-5" aria-hidden />
              ) : (
                <PanelLeft className="size-5" aria-hidden />
              )}
            </button>
            <Link href="/note" className="flex min-h-9 coarse:min-h-11 shrink-0 items-center gap-2 sm:gap-2.5" aria-label="Bursa Note">
              <BrandLogo variant="product" decorative />
              <span className="hidden h-4 w-px bg-zinc-700 sm:block" aria-hidden />
              <span className="font-heading text-sm font-semibold tracking-wide">Note</span>
            </Link>
          </div>
          <a
            href={helpHref}
            aria-label={copy.support}
            className="inline-flex min-h-9 coarse:min-h-11 min-w-9 coarse:min-w-11 shrink-0 items-center justify-center text-sm text-zinc-400 hover:text-zinc-100"
          >
            {copy.support}
          </a>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          id="note-desktop-sidebar"
          className={cn(
            "hidden shrink-0 self-stretch border-r border-zinc-800/80 lg:min-h-0 lg:flex-col",
            sidebarOpen ? "lg:flex w-60 xl:w-64" : "lg:hidden"
          )}
        >
          <NoteSidebar />
        </aside>

        {menuOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/60"
              aria-label={copy.tutup}
              tabIndex={-1}
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
                  className="inline-flex min-h-9 coarse:min-h-11 min-w-9 coarse:min-w-11 items-center justify-center rounded-md px-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  aria-label={copy.tutup}
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

        <main
          id="note-main"
          tabIndex={-1}
          className={`min-h-0 min-w-0 flex-1 overflow-y-auto ${chromePad} py-5 sm:py-7`}
        >
          {title ? (
            <h1 className="mb-4 font-heading text-2xl font-semibold tracking-tight text-zinc-100 sm:mb-5 sm:text-3xl">
              {title}
            </h1>
          ) : null}
          {children}
        </main>
      </div>

      <NoteAiAssistant />

      {showOnboarding ? (
        <NoteJournalOnboarding
          locale={prefs.locale}
          currency={prefs.currency}
          usdIdrRate={prefs.usdIdrRate}
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
    <NoteJournalDbProvider>
      <NoteJournalProvider>
        <NoteShellInner title={title}>{children}</NoteShellInner>
      </NoteJournalProvider>
    </NoteJournalDbProvider>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NoteSidebarProfile } from "@/components/note/note-sidebar-profile";
import { NOTE_NAV, NOTE_TRACK_NAV, noteNavActive, noteSection } from "@/lib/note/sections";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

export function NoteSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [prefs] = useNotePrefs();

  function go() {
    onNavigate?.();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-4" aria-label="Note">
        <ul className="space-y-0.5">
          {NOTE_NAV.map((item) => {
            const active = noteNavActive(pathname, item.href);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  title={noteSection(item.id).role[prefs.locale]}
                  aria-current={active ? "page" : undefined}
                  onClick={go}
                  className={cn(
                    "block rounded-md px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-zinc-900 font-medium text-zinc-50"
                      : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-100"
                  )}
                >
                  {item.label[prefs.locale]}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="my-3 border-t border-zinc-800/80" role="separator" aria-hidden />

        <p className="px-2.5 pb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
          {prefs.locale === "en" ? "Invest" : "Investasi"}
        </p>
        <ul className="space-y-0.5">
          {NOTE_TRACK_NAV.map((item) => {
            const active = noteNavActive(pathname, item.href);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  title={item.hint[prefs.locale]}
                  aria-current={active ? "page" : undefined}
                  onClick={go}
                  className={cn(
                    "block rounded-md px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-zinc-900 font-medium text-zinc-50"
                      : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-100"
                  )}
                >
                  {item.label[prefs.locale]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <NoteSidebarProfile />
    </div>
  );
}

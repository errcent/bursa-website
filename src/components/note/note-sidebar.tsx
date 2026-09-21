"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NoteSidebarProfile } from "@/components/note/note-sidebar-profile";
import { noteCopy } from "@/lib/note/copy";
import { NOTE_NAV, NOTE_TRACK_NAV, noteNavActive, noteSection } from "@/lib/note/sections";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  label,
  title,
  active,
  onClick,
}: {
  href: string;
  label: string;
  title: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      title={title}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "flex min-h-11 items-center rounded-md px-2.5 text-sm transition-colors",
        active
          ? "bg-zinc-900 font-medium text-zinc-50"
          : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-100"
      )}
    >
      {label}
    </Link>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="px-2.5 pb-1.5 pt-1 text-xs font-medium tracking-wide text-zinc-400">{children}</p>
  );
}

export function NoteSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);

  function go() {
    onNavigate?.();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="Note">
        <SectionLabel>{copy.navTrade}</SectionLabel>
        <ul className="space-y-0.5">
          {NOTE_NAV.map((item) => {
            const active = noteNavActive(pathname, item.href);
            return (
              <li key={item.id}>
                <NavLink
                  href={item.href}
                  label={item.label[prefs.locale]}
                  title={noteSection(item.id).role[prefs.locale]}
                  active={active}
                  onClick={go}
                />
              </li>
            );
          })}
        </ul>

        <div className="my-3 border-t border-zinc-800/80" role="separator" aria-hidden />

        <SectionLabel>{copy.navInvest}</SectionLabel>
        <ul className="space-y-0.5">
          {NOTE_TRACK_NAV.map((item) => {
            const active = noteNavActive(pathname, item.href);
            return (
              <li key={item.id}>
                <NavLink
                  href={item.href}
                  label={item.label[prefs.locale]}
                  title={item.hint[prefs.locale]}
                  active={active}
                  onClick={go}
                />
              </li>
            );
          })}
        </ul>
      </nav>
      <NoteSidebarProfile />
    </div>
  );
}

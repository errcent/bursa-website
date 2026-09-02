"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { useNoteKind } from "@/components/note/note-kind-context";
import { NoteWeekdayStrip } from "@/components/note/note-weekday-strip";
import { isProductionHostRouting, originFor } from "@/lib/hosts/hosts";
import { noteCopy } from "@/lib/note/copy";
import { pnlOptsFromPrefs } from "@/lib/note/prefs";
import { filterEntries, weekdayNets } from "@/lib/note/stats";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

function Cluster({ children }: { children: ReactNode }) {
  return <div className="space-y-3 border-t border-zinc-800/80 pt-5 first:border-t-0 first:pt-0">{children}</div>;
}

function Quiet({ children }: { children: ReactNode }) {
  return <p className="px-0.5 text-[10px] text-zinc-600">{children}</p>;
}

function TextLink({
  href,
  current,
  children,
}: {
  href: string;
  current?: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        "text-sm hover:text-zinc-100",
        current ? "text-zinc-50" : "text-zinc-400"
      )}
    >
      {children}
    </Link>
  );
}

export function NoteSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const { kind, setKind } = useNoteKind();
  const journal = useNoteJournal();
  const catalogHref = isProductionHostRouting() ? originFor("apex") : "/";
  const helpHref = isProductionHostRouting() ? `${originFor("apex")}/bantuan` : "/bantuan";
  const onJournal = pathname === "/note";
  const onBaru = pathname.startsWith("/note/baru");
  const onImpor = pathname.startsWith("/note/impor");
  const onSetelan = pathname.startsWith("/note/setelan");

  const kindScoped = useMemo(
    () => filterEntries(journal.data?.entries ?? [], { kind, result: "ALL" }),
    [journal.data, kind]
  );
  const weekNets = useMemo(() => weekdayNets(kindScoped), [kindScoped]);
  const cellOpts = { ...pnlOptsFromPrefs(prefs), compact: true, naked: true, decimals: 0 as const };

  function go() {
    onNavigate?.();
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-3 py-5">
      <div className="space-y-0" onClick={go}>
        <Cluster>
          <Link
            href="/note/baru"
            aria-current={onBaru ? "page" : undefined}
            className={cn(
              "block rounded-md bg-zinc-100 px-2 py-2.5 text-center text-sm font-medium text-zinc-950 hover:bg-white",
              onBaru ? "ring-1 ring-zinc-400" : ""
            )}
          >
            {copy.baru}
          </Link>
          <div className="flex items-center gap-3 px-0.5">
            <TextLink href="/note" current={onJournal}>
              {copy.journal}
            </TextLink>
            <span className="text-zinc-700" aria-hidden>
              ·
            </span>
            <TextLink href="/note/impor" current={onImpor}>
              {copy.impor}
            </TextLink>
          </div>
        </Cluster>
      </div>

      {onJournal ? (
        <Cluster>
          <div className="space-y-2">
            <Quiet>{copy.jenis}</Quiet>
            <div
              className="grid grid-cols-3 rounded-md border border-zinc-800 p-0.5"
              role="group"
              aria-label={copy.jenis}
            >
              {(
                [
                  ["ALL", copy.semua],
                  ["TRADE", copy.trade],
                  ["INVEST", copy.invest],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setKind(value)}
                  aria-pressed={kind === value}
                  className={cn(
                    "rounded px-1 py-1.5 text-[11px] leading-none",
                    kind === value ? "bg-zinc-900 text-zinc-50" : "text-zinc-500 hover:text-zinc-200"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Quiet>{copy.polaMinggu}</Quiet>
            {journal.loading ? (
              <p className="text-xs text-zinc-600">…</p>
            ) : (
              <NoteWeekdayStrip
                nets={weekNets}
                weekStart={prefs.weekStart}
                colorMode={prefs.colorMode}
                formatOpts={cellOpts}
                compact
              />
            )}
          </div>
        </Cluster>
      ) : null}

      <Cluster>
        <div onClick={go}>
          <TextLink href="/note/setelan" current={onSetelan}>
            {copy.setelan}
          </TextLink>
        </div>
      </Cluster>

      <div className="mt-auto space-y-3 px-0.5 pb-2 pt-8 text-[11px] leading-relaxed text-zinc-600">
        <p className="flex flex-wrap gap-x-3 gap-y-1">
          <a href={catalogHref} className="hover:text-zinc-300" onClick={go}>
            {copy.kelas}
          </a>
          <a href={helpHref} className="hover:text-zinc-300" onClick={go}>
            {copy.disclaimer}
          </a>
        </p>
        <p>{copy.privacyFoot}</p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  FileDown,
  FileText,
  Loader2,
  StickyNote,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { useAuth } from "@/components/auth-provider";
import { NotesRichEditor } from "@/components/video/notes-rich-editor";
import { Button } from "@/components/ui/button";
import { buildLoginHref, resolvePostAuthRedirect, POST_AUTH_HOME } from "@/lib/auth/redirect";
import {
  downloadNotesExport,
  noteHasVisibleContent,
  type NoteExportFormat,
} from "@/lib/lesson-notes/export";
import { mergeNotesContent, pickPrimaryNote } from "@/lib/lesson-notes/merge";
import type { LessonNote } from "@/lib/lesson-notes/types";
import { cn } from "@/lib/utils";

const AUTOSAVE_DELAY_MS = 1200;

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface LessonNotesPanelProps {
  courseSlug: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  /** Tighter layout for the right sidebar panel */
  variant?: "default" | "sidebar";
}

const EXPORT_OPTIONS: { format: NoteExportFormat; label: string; hint: string }[] = [
  { format: "docx", label: "DOCX", hint: "Microsoft Word / Google Docs" },
  { format: "pdf", label: "PDF", hint: "File PDF siap dibaca" },
  {
    format: "notion",
    label: "Notion",
    hint: "Markdown siap Import → Markdown & CSV",
  },
  { format: "md", label: "MD", hint: "Markdown untuk Obsidian / Git" },
  { format: "txt", label: "TXT", hint: "Teks polos tanpa format" },
];

const easeOut = [0.22, 1, 0.36, 1] as const;

function SaveIndicator({ status }: { status: SaveStatus }) {
  const label =
    status === "saving"
      ? "Menyimpan"
      : status === "saved"
        ? "Tersimpan"
        : status === "error"
          ? "Gagal menyimpan"
          : "";

  return (
    <span
      className="inline-flex size-7 items-center justify-center"
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      {label ? <span className="sr-only">{label}</span> : null}
      <AnimatePresence mode="wait" initial={false}>
        {status === "saving" && (
          <motion.span
            key="saving"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15, ease: easeOut }}
            className="inline-flex"
          >
            <Loader2
              className="size-3.5 animate-spin text-muted-foreground"
              aria-hidden
            />
          </motion.span>
        )}
        {status === "saved" && (
          <motion.span
            key="saved"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: [0.75, 1.12, 1] }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className="inline-flex text-emerald"
          >
            <Check className="size-3.5" aria-hidden strokeWidth={2.5} />
          </motion.span>
        )}
        {status === "error" && (
          <motion.span
            key="error"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15, ease: easeOut }}
            className="inline-flex text-destructive"
          >
            <AlertCircle className="size-3.5" aria-hidden />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

interface AuthPayload {
  userId: string;
  email?: string;
  name?: string;
  role?: string;
}

function notesAuthHeaders(
  authPayload: AuthPayload,
  withJson = false
): HeadersInit {
  return {
    ...(withJson ? { "Content-Type": "application/json" } : {}),
    ...(authPayload.email ? { "x-user-email": authPayload.email } : {}),
  };
}

export function LessonNotesPanel({
  courseSlug,
  courseTitle,
  lessonId,
  lessonTitle,
  variant = "default",
}: LessonNotesPanelProps) {
  const { session } = useAuth();
  const pathname = usePathname();
  const loginHref = buildLoginHref(pathname);
  const registerHref = useMemo(() => {
    const next = resolvePostAuthRedirect(pathname);
    return next === POST_AUTH_HOME ? "/daftar" : `/daftar?next=${encodeURIComponent(next)}`;
  }, [pathname]);

  const [note, setNote] = useState<LessonNote | null>(null);
  const [html, setHtml] = useState("<p></p>");
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const lastSavedRef = useRef("<p></p>");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  const apiBase = `/api/courses/${courseSlug}/lessons/${lessonId}/notes`;

  const authPayload = useMemo(() => {
    if (!session) return null;
    return {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
    };
  }, [session]);

  const consolidateLegacyNotes = useCallback(
    async (primary: LessonNote, mergedContent: string, extraNotes: LessonNote[]) => {
      if (!authPayload || extraNotes.length === 0) return;

      await fetch(`${apiBase}/${primary.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: notesAuthHeaders(authPayload, true),
        body: JSON.stringify({
          ...authPayload,
          content: mergedContent,
        }),
      });

      await Promise.all(
        extraNotes.map((extra) =>
          fetch(`${apiBase}/${extra.id}`, {
            method: "DELETE",
            credentials: "include",
            headers: notesAuthHeaders(authPayload, true),
            body: JSON.stringify(authPayload),
          })
        )
      );
    },
    [apiBase, authPayload]
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!session?.userId) {
        if (!cancelled) {
          setNote(null);
          setHtml("<p></p>");
          lastSavedRef.current = "<p></p>";
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          userId: session.userId,
          ...(session.email ? { email: session.email } : {}),
        });
        const res = await fetch(`${apiBase}?${params}`, {
          cache: "no-store",
          credentials: "include",
          headers: notesAuthHeaders({
            userId: session.userId,
            email: session.email,
            name: session.name,
            role: session.role,
          }),
        });
        if (cancelled) return;
        if (res.status === 401) {
          setNote(null);
          setHtml("<p></p>");
          lastSavedRef.current = "<p></p>";
          setError(null);
          return;
        }
        if (!res.ok) {
          setNote(null);
          setHtml("<p></p>");
          lastSavedRef.current = "<p></p>";
          setError("Gagal memuat catatan.");
          return;
        }

        const data = await res.json();
        const notes = (data.notes ?? []) as LessonNote[];
        const primary = pickPrimaryNote(notes);
        const mergedContent = mergeNotesContent(notes);

        setNote(primary);
        setHtml(mergedContent);
        lastSavedRef.current = mergedContent;
        setError(null);

        if (primary && notes.length > 1) {
          const extras = notes.filter((entry) => entry.id !== primary.id);
          void consolidateLegacyNotes(primary, mergedContent, extras);
        }
      } catch {
        if (!cancelled) {
          setNote(null);
          setHtml("<p></p>");
          lastSavedRef.current = "<p></p>";
          setError("Gagal memuat catatan.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    apiBase,
    consolidateLegacyNotes,
    session?.email,
    session?.name,
    session?.role,
    session?.userId,
  ]);

  useEffect(() => {
    if (!authPayload) return;
    if (html === lastSavedRef.current) return;
    if (!noteHasVisibleContent(html)) return;
    if (savingRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void (async () => {
        if (savingRef.current || !noteHasVisibleContent(html)) return;
        savingRef.current = true;
        setSaveStatus("saving");
        setError(null);

        try {
          if (note?.id) {
            const res = await fetch(`${apiBase}/${note.id}`, {
              method: "PATCH",
              credentials: "include",
              headers: notesAuthHeaders(authPayload, true),
              body: JSON.stringify({
                ...authPayload,
                content: html,
              }),
            });
            if (!res.ok) {
              setSaveStatus("error");
              setError("Gagal memperbarui catatan.");
              return;
            }
            const data = await res.json();
            setNote(data.note as LessonNote);
          } else {
            const res = await fetch(apiBase, {
              method: "POST",
              credentials: "include",
              headers: notesAuthHeaders(authPayload, true),
              body: JSON.stringify({
                ...authPayload,
                content: html,
              }),
            });
            if (!res.ok) {
              setSaveStatus("error");
              setError("Gagal menyimpan catatan.");
              return;
            }
            const data = await res.json();
            setNote(data.note as LessonNote);
          }

          lastSavedRef.current = html;
          setSaveStatus("saved");
          if (savedFadeRef.current) clearTimeout(savedFadeRef.current);
          savedFadeRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
        } catch {
          setSaveStatus("error");
          setError("Gagal menyimpan catatan.");
        } finally {
          savingRef.current = false;
        }
      })();
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [html, note?.id, apiBase, authPayload]);

  useEffect(
    () => () => {
      if (savedFadeRef.current) clearTimeout(savedFadeRef.current);
    },
    []
  );

  useEffect(() => {
    if (!exportMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;
      if (
        target &&
        exportMenuRef.current &&
        !exportMenuRef.current.contains(target)
      ) {
        setExportMenuOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setExportMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [exportMenuOpen]);

  async function handleExport(format: NoteExportFormat) {
    if (!noteHasVisibleContent(html) || exporting) return;
    setExportMenuOpen(false);
    setExporting(true);
    setError(null);
    try {
      await downloadNotesExport(html, { courseTitle, lessonTitle }, format);
    } catch {
      setError("Gagal mengunduh catatan.");
    } finally {
      setExporting(false);
    }
  }

  const isSidebar = variant === "sidebar";
  const canExport = noteHasVisibleContent(html);

  if (!session?.userId || !authPayload) {
    return (
      <div className={cn("py-4 text-center", isSidebar && "py-2")}>
        <StickyNote className="mx-auto mb-2 size-5 text-muted-foreground" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Masuk untuk menulis catatan lesson, lalu unduh sebagai DOCX, PDF, Notion,
          Markdown, atau TXT.
        </p>
        <div
          className={cn(
            "mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center",
            isSidebar && "sm:flex-col"
          )}
        >
          <Button
            size="sm"
            className="btn-primary w-full sm:min-w-[7.5rem]"
            render={<Link href={loginHref} />}
          >
            Masuk
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full sm:min-w-[7.5rem]"
            render={<Link href={registerHref} />}
          >
            Daftar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {error && (
        <p className="mb-1 shrink-0 text-xs text-destructive">{error}</p>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat catatan…
        </div>
      ) : (
        <>
          <NotesRichEditor
            key={`lesson-note-${lessonId}`}
            content={html}
            onChange={setHtml}
            autofocus={!isSidebar}
            bare
            fillHeight
            placeholder="Tulis catatan…"
            ariaLabel={`Catatan untuk ${lessonTitle}`}
            minHeightClass={isSidebar ? "min-h-0" : "min-h-[14rem]"}
            className="min-h-0 flex-1"
          />

          <div
            className={cn(
              "mt-2 flex shrink-0 items-center justify-between gap-2 border-t border-border/40 pt-2",
              isSidebar && "pt-1.5"
            )}
          >
            <SaveIndicator status={saveStatus} />
            <div ref={exportMenuRef} className="relative shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canExport || exporting}
                aria-expanded={exportMenuOpen}
                aria-haspopup="listbox"
                className="gap-1.5"
                onClick={() => setExportMenuOpen((open) => !open)}
              >
                {exporting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <FileDown className="size-3.5" />
                )}
                Unduh catatan
                <ChevronDown
                  className={cn(
                    "size-3.5 opacity-60 transition-transform",
                    exportMenuOpen && "rotate-180"
                  )}
                />
              </Button>

              <AnimatePresence>
                {exportMenuOpen && (
                  <motion.div
                    key="notes-export-menu"
                    initial={{ y: 6, scale: 0.98, opacity: 0 }}
                    animate={{ y: 0, scale: 1, opacity: 1 }}
                    exit={{ y: 6, scale: 0.98, opacity: 0 }}
                    transition={{ duration: 0.16, ease: easeOut }}
                    role="listbox"
                    aria-label="Format unduhan catatan"
                    className="absolute bottom-full right-0 z-50 mb-2 w-64 overflow-hidden rounded-2xl border-2 border-border bg-popover text-popover-foreground shadow-[0_20px_48px_-12px_rgba(0,0,0,0.55)] dark:border-white/10"
                  >
                    <div className="border-b border-border px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Format ekspor
                      </p>
                    </div>
                    <div className="p-1.5">
                      {EXPORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.format}
                          type="button"
                          role="option"
                          aria-selected={false}
                          disabled={exporting}
                          onClick={() => void handleExport(opt.format)}
                          className="flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-muted disabled:opacity-50"
                        >
                          <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">{opt.label}</span>
                            <span className="block text-[11px] text-muted-foreground">
                              {opt.hint}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

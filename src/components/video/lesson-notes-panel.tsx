"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Clock,
  FileDown,
  FileText,
  Loader2,
  StickyNote,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { useAuth } from "@/components/auth-provider";
import { NotesRichEditor } from "@/components/video/notes-rich-editor";
import { Button } from "@/components/ui/button";
import {
  downloadNotesExport,
  noteHasVisibleContent,
  type NoteExportFormat,
} from "@/lib/lesson-notes/export";
import type { LessonNote } from "@/lib/lesson-notes/types";
import { cn } from "@/lib/utils";

const AUTOSAVE_DELAY_MS = 1200;

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface LessonNotesPanelProps {
  courseSlug: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  playheadSeconds: number;
  onSeek?: (seconds: number) => void;
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
  if (status === "idle") return null;
  return (
    <span
      className={cn(
        "text-[10px] tabular-nums",
        status === "error" ? "text-destructive" : "text-muted-foreground"
      )}
      aria-live="polite"
    >
      {status === "saving" && "Menyimpan…"}
      {status === "saved" && "Tersimpan"}
      {status === "error" && "Gagal menyimpan"}
    </span>
  );
}

interface AuthPayload {
  userId: string;
  email?: string;
  name?: string;
  role?: string;
}

interface InlineNoteBlockProps {
  note: LessonNote;
  apiBase: string;
  authPayload: AuthPayload;
  playheadSeconds: number;
  onSeek?: (seconds: number) => void;
  onUpdated: (note: LessonNote) => void;
  onDeleted: (noteId: string) => void;
  onError: (message: string | null) => void;
  compact?: boolean;
}

function InlineNoteBlock({
  note,
  apiBase,
  authPayload,
  playheadSeconds,
  onSeek,
  onUpdated,
  onDeleted,
  onError,
  compact,
}: InlineNoteBlockProps) {
  const [html, setHtml] = useState(note.content);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [deleting, setDeleting] = useState(false);
  const lastSavedRef = useRef(note.content);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (html === lastSavedRef.current) return;
    if (!noteHasVisibleContent(html)) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void (async () => {
        setStatus("saving");
        onError(null);
        try {
          const res = await fetch(`${apiBase}/${note.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...authPayload,
              content: html,
              timestampSeconds: note.timestampSeconds,
            }),
          });
          if (!res.ok) {
            setStatus("error");
            onError("Gagal memperbarui catatan.");
            return;
          }
          const data = await res.json();
          const updated = data.note as LessonNote;
          lastSavedRef.current = html;
          onUpdated(updated);
          setStatus("saved");
          if (savedFadeRef.current) clearTimeout(savedFadeRef.current);
          savedFadeRef.current = setTimeout(() => setStatus("idle"), 2000);
        } catch {
          setStatus("error");
          onError("Gagal memperbarui catatan.");
        }
      })();
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [html, note.id, note.timestampSeconds, apiBase, authPayload, onUpdated, onError]);

  useEffect(
    () => () => {
      if (savedFadeRef.current) clearTimeout(savedFadeRef.current);
    },
    []
  );

  async function handleDelete() {
    if (!window.confirm("Hapus catatan ini?")) return;
    setDeleting(true);
    onError(null);
    try {
      const res = await fetch(`${apiBase}/${note.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authPayload),
      });
      if (!res.ok) {
        onError("Gagal menghapus catatan.");
        return;
      }
      onDeleted(note.id);
    } catch {
      onError("Gagal menghapus catatan.");
    } finally {
      setDeleting(false);
    }
  }

  async function updateTimestampToPlayhead() {
    if (note.timestampSeconds === Math.floor(playheadSeconds)) return;
    setStatus("saving");
    onError(null);
    try {
      const res = await fetch(`${apiBase}/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...authPayload,
          content: html,
          timestampSeconds: Math.floor(playheadSeconds),
        }),
      });
      if (!res.ok) {
        setStatus("error");
        onError("Gagal memperbarui timestamp.");
        return;
      }
      const data = await res.json();
      onUpdated(data.note as LessonNote);
      setStatus("saved");
      if (savedFadeRef.current) clearTimeout(savedFadeRef.current);
      savedFadeRef.current = setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      onError("Gagal memperbarui timestamp.");
    }
  }

  return (
    <li className="rounded-lg border border-border bg-card text-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-2.5 py-1.5">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSeek?.(note.timestampSeconds)}
            className="inline-flex h-fit shrink-0 items-center gap-1 rounded-md bg-foreground/10 px-2 py-0.5 font-mono text-[11px] hover:bg-foreground/20"
            title="Lompat ke timestamp ini"
          >
            <Clock className="size-3 opacity-70" />
            {formatDuration(note.timestampSeconds)}
          </button>
          <button
            type="button"
            onClick={() => void updateTimestampToPlayhead()}
            className="truncate text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            title="Perbarui timestamp ke posisi playhead"
          >
            → {formatDuration(playheadSeconds)}
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <SaveIndicator status={status} />
          <Button
            size="sm"
            variant="ghost"
            className="size-7 p-0 text-destructive hover:text-destructive"
            disabled={deleting}
            aria-label="Hapus catatan"
            onClick={() => void handleDelete()}
          >
            {deleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </Button>
        </div>
      </div>
      <NotesRichEditor
        key={`note-${note.id}`}
        content={html}
        onChange={setHtml}
        ariaLabel={`Catatan di menit ${formatDuration(note.timestampSeconds)}`}
        minHeightClass={compact ? "min-h-[72px]" : "min-h-[100px]"}
        className="rounded-none border-0 bg-transparent"
      />
    </li>
  );
}

interface DraftNoteEditorProps {
  apiBase: string;
  authPayload: AuthPayload;
  playheadSeconds: number;
  onCreated: (note: LessonNote) => void;
  onError: (message: string | null) => void;
  autofocus?: boolean;
  compact?: boolean;
  placeholder?: string;
}

function DraftNoteEditor({
  apiBase,
  authPayload,
  playheadSeconds,
  onCreated,
  onError,
  autofocus = false,
  compact,
  placeholder,
}: DraftNoteEditorProps) {
  const [html, setHtml] = useState("<p></p>");
  const [editorKey, setEditorKey] = useState(0);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const creatingRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!noteHasVisibleContent(html)) return;
    if (creatingRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void (async () => {
        if (creatingRef.current || !noteHasVisibleContent(html)) return;
        creatingRef.current = true;
        setStatus("saving");
        onError(null);
        try {
          const res = await fetch(apiBase, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...authPayload,
              content: html,
              timestampSeconds: Math.floor(playheadSeconds),
            }),
          });
          if (!res.ok) {
            setStatus("error");
            onError("Gagal menyimpan catatan.");
            creatingRef.current = false;
            return;
          }
          const data = await res.json();
          onCreated(data.note as LessonNote);
          setHtml("<p></p>");
          setEditorKey((k) => k + 1);
          setStatus("saved");
          if (savedFadeRef.current) clearTimeout(savedFadeRef.current);
          savedFadeRef.current = setTimeout(() => setStatus("idle"), 2000);
        } catch {
          setStatus("error");
          onError("Gagal menyimpan catatan.");
        } finally {
          creatingRef.current = false;
        }
      })();
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [html, apiBase, authPayload, playheadSeconds, onCreated, onError]);

  useEffect(
    () => () => {
      if (savedFadeRef.current) clearTimeout(savedFadeRef.current);
    },
    []
  );

  return (
    <div className="rounded-lg border border-dashed border-border/80 bg-card/50">
      <div className="flex items-center justify-between gap-2 border-b border-border/40 px-2.5 py-1.5">
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
          <Clock className="size-3 opacity-70" />
          {formatDuration(playheadSeconds)}
        </span>
        <SaveIndicator status={status} />
      </div>
      <NotesRichEditor
        key={`draft-${editorKey}`}
        content={html}
        onChange={setHtml}
        autofocus={autofocus}
        placeholder={
          placeholder ??
          `Mulai mengetik — otomatis tersimpan di menit ${formatDuration(playheadSeconds)}…`
        }
        ariaLabel="Catatan baru"
        minHeightClass={compact ? "min-h-[96px]" : "min-h-[140px]"}
        className="rounded-none border-0 bg-transparent"
      />
    </div>
  );
}

export function LessonNotesPanel({
  courseSlug,
  courseTitle,
  lessonId,
  lessonTitle,
  playheadSeconds,
  onSeek,
  variant = "default",
}: LessonNotesPanelProps) {
  const { session } = useAuth();
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!session?.userId) {
        if (!cancelled) {
          setNotes([]);
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
        const res = await fetch(`${apiBase}?${params}`, { cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) {
          setNotes([]);
          setError("Gagal memuat catatan.");
          return;
        }
        const data = await res.json();
        setNotes(data.notes ?? []);
        setError(null);
      } catch {
        if (!cancelled) {
          setNotes([]);
          setError("Gagal memuat catatan.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, session?.email, session?.userId]);

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

  const handleNoteUpdated = useCallback((updated: LessonNote) => {
    setNotes((prev) =>
      prev
        .map((n) => (n.id === updated.id ? updated : n))
        .sort(
          (a, b) =>
            a.timestampSeconds - b.timestampSeconds ||
            a.createdAt.localeCompare(b.createdAt)
        )
    );
  }, []);

  const handleNoteCreated = useCallback((note: LessonNote) => {
    setNotes((prev) =>
      [...prev, note].sort(
        (a, b) =>
          a.timestampSeconds - b.timestampSeconds ||
          a.createdAt.localeCompare(b.createdAt)
      )
    );
  }, []);

  const handleNoteDeleted = useCallback((noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }, []);

  async function handleExport(format: NoteExportFormat) {
    if (notes.length === 0 || exporting) return;
    setExportMenuOpen(false);
    setExporting(true);
    setError(null);
    try {
      await downloadNotesExport(notes, { courseTitle, lessonTitle }, format);
    } catch {
      setError("Gagal mengunduh catatan.");
    } finally {
      setExporting(false);
    }
  }

  const isSidebar = variant === "sidebar";
  const draftAutofocus = !isLoading && notes.length === 0;

  if (!session?.userId || !authPayload) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card px-4 py-6 text-center",
          isSidebar && "py-4"
        )}
      >
        <StickyNote className="mx-auto mb-2 size-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Masuk untuk menulis catatan dokumen dengan timestamp video, lalu unduh sebagai DOCX,
          PDF, Notion, Markdown, atau TXT.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2",
          isSidebar && "flex-col items-stretch"
        )}
      >
        {!isSidebar && (
          <p className="text-xs text-muted-foreground">
            Ketik langsung · otomatis tersimpan · pilih teks untuk format
          </p>
        )}
        <div ref={exportMenuRef} className={cn("relative", isSidebar && "w-full")}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={notes.length === 0 || exporting}
            aria-expanded={exportMenuOpen}
            aria-haspopup="listbox"
            className={cn("gap-1.5", isSidebar && "w-full")}
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
                initial={{ y: -6, scale: 0.98, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: -6, scale: 0.98, opacity: 0 }}
                transition={{ duration: 0.16, ease: easeOut }}
                role="listbox"
                aria-label="Format unduhan catatan"
                className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border-2 border-border bg-popover text-popover-foreground shadow-[0_20px_48px_-12px_rgba(0,0,0,0.55)] dark:border-white/10"
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

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat catatan…
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.length > 0 && (
            <ul className="flex flex-col gap-2">
              {notes.map((note) => (
                <InlineNoteBlock
                  key={note.id}
                  note={note}
                  apiBase={apiBase}
                  authPayload={authPayload}
                  playheadSeconds={playheadSeconds}
                  onSeek={onSeek}
                  onUpdated={handleNoteUpdated}
                  onDeleted={handleNoteDeleted}
                  onError={setError}
                  compact={isSidebar}
                />
              ))}
            </ul>
          )}

          <DraftNoteEditor
            key={`draft-lesson-${lessonId}`}
            apiBase={apiBase}
            authPayload={authPayload}
            playheadSeconds={playheadSeconds}
            onCreated={handleNoteCreated}
            onError={setError}
            autofocus={draftAutofocus}
            compact={isSidebar}
            placeholder={
              notes.length === 0
                ? "Mulai mengetik catatan lesson ini…"
                : `Catatan baru di menit ${formatDuration(playheadSeconds)}…`
            }
          />

          {isSidebar && notes.length === 0 && (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Pilih teks untuk menu format · Ctrl+B tebal · Ctrl+I miring · timestamp mengikuti
              playhead video
            </p>
          )}
        </div>
      )}
    </div>
  );
}

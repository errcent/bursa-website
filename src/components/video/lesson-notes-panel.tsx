"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Clock,
  FileDown,
  FileText,
  Loader2,
  Pencil,
  Plus,
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
import { sanitizeRichHtml } from "@/lib/sanitize-html";
import { cn } from "@/lib/utils";

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

interface LessonNotesPanelProps {
  courseSlug: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  playheadSeconds: number;
  onSeek?: (seconds: number) => void;
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

export function LessonNotesPanel({
  courseSlug,
  courseTitle,
  lessonId,
  lessonTitle,
  playheadSeconds,
  onSeek,
}: LessonNotesPanelProps) {
  const { session } = useAuth();
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draftHtml, setDraftHtml] = useState("<p></p>");
  const [draftEditorKey, setDraftEditorKey] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHtml, setEditHtml] = useState("");
  const [editTimestamp, setEditTimestamp] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  function resetDraft() {
    setDraftHtml("<p></p>");
    setDraftEditorKey((k) => k + 1);
  }

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

  const loadNotes = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (!session?.userId) {
        setNotes([]);
        setIsLoading(false);
        return;
      }

      if (!opts?.soft) setIsLoading(true);
      try {
        const params = new URLSearchParams({
          userId: session.userId,
          ...(session.email ? { email: session.email } : {}),
        });
        const res = await fetch(`${apiBase}?${params}`, { cache: "no-store" });
        if (!res.ok) {
          setNotes([]);
          setError("Gagal memuat catatan.");
          return;
        }
        const data = await res.json();
        setNotes(data.notes ?? []);
        setError(null);
      } catch {
        setNotes([]);
        setError("Gagal memuat catatan.");
      } finally {
        setIsLoading(false);
      }
    },
    [apiBase, session?.email, session?.userId]
  );

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

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

  async function createNote() {
    if (!authPayload) {
      setError("Masuk terlebih dahulu untuk menyimpan catatan.");
      return;
    }
    if (!noteHasVisibleContent(draftHtml)) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...authPayload,
          content: draftHtml,
          timestampSeconds: Math.floor(playheadSeconds),
        }),
      });
      if (!res.ok) {
        setError("Gagal menyimpan catatan.");
        return;
      }
      const data = await res.json();
      setNotes((prev) =>
        [...prev, data.note as LessonNote].sort(
          (a, b) => a.timestampSeconds - b.timestampSeconds || a.createdAt.localeCompare(b.createdAt)
        )
      );
      resetDraft();
      setComposerOpen(false);
    } catch {
      setError("Gagal menyimpan catatan.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveEdit(noteId: string) {
    if (!authPayload || !noteHasVisibleContent(editHtml)) return;
    setBusyId(noteId);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...authPayload,
          content: editHtml,
          timestampSeconds: Math.floor(editTimestamp),
        }),
      });
      if (!res.ok) {
        setError("Gagal memperbarui catatan.");
        return;
      }
      const data = await res.json();
      setNotes((prev) =>
        prev
          .map((n) => (n.id === noteId ? (data.note as LessonNote) : n))
          .sort(
            (a, b) =>
              a.timestampSeconds - b.timestampSeconds || a.createdAt.localeCompare(b.createdAt)
          )
      );
      setEditingId(null);
      setEditHtml("");
    } catch {
      setError("Gagal memperbarui catatan.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteNote(noteId: string) {
    if (!authPayload) return;
    if (!window.confirm("Hapus catatan ini?")) return;
    setBusyId(noteId);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/${noteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authPayload),
      });
      if (!res.ok) {
        setError("Gagal menghapus catatan.");
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (editingId === noteId) {
        setEditingId(null);
        setEditHtml("");
      }
    } catch {
      setError("Gagal menghapus catatan.");
    } finally {
      setBusyId(null);
    }
  }

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

  if (!session?.userId) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-6 text-center">
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Editor dokumen privat per lesson · setiap catatan menyimpan menit video
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div ref={exportMenuRef} className="relative">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={notes.length === 0 || exporting}
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

          <Button
            size="sm"
            className="btn-primary"
            onClick={() => setComposerOpen((open) => !open)}
          >
            <Plus className="size-4" />
            Catatan baru
          </Button>
        </div>
      </div>

      {composerOpen && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-foreground/10 px-2 py-0.5 font-mono text-xs">
              <Clock className="size-3 opacity-70" />
              {formatDuration(playheadSeconds)}
            </span>
            <span className="text-xs text-muted-foreground">
              Timestamp playhead — dilampirkan saat menyimpan
            </span>
          </div>
          <NotesRichEditor
            key={`draft-${draftEditorKey}`}
            content={draftHtml}
            onChange={setDraftHtml}
            placeholder={`Tulis seperti dokumen di menit ${formatDuration(playheadSeconds)}…`}
            autofocus
            minHeightClass="min-h-[160px]"
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setComposerOpen(false);
                resetDraft();
              }}
            >
              Batal
            </Button>
            <Button
              size="sm"
              className="btn-primary"
              disabled={submitting || !noteHasVisibleContent(draftHtml)}
              onClick={() => void createNote()}
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Simpan catatan
            </Button>
          </div>
        </div>
      )}

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
      ) : notes.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">
          Belum ada catatan. Tekan &ldquo;Catatan baru&rdquo; saat menonton untuk menulis poin
          penting seperti dokumen, dengan timestamp video yang bisa dilompati.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => {
            const isEditing = editingId === note.id;
            return (
              <li
                key={note.id}
                className="rounded-lg border border-border bg-card p-3 text-sm"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  {isEditing ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-foreground/10 px-2 py-0.5 font-mono text-xs">
                        <Clock className="size-3 opacity-70" />
                        {formatDuration(editTimestamp)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2 text-[11px]"
                        onClick={() => setEditTimestamp(Math.floor(playheadSeconds))}
                      >
                        Pakai playhead ({formatDuration(playheadSeconds)})
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSeek?.(note.timestampSeconds)}
                      className="inline-flex h-fit shrink-0 items-center gap-1.5 rounded-md bg-foreground/10 px-2 py-0.5 font-mono text-xs hover:bg-foreground/20"
                      title="Lompat ke timestamp ini"
                    >
                      <Clock className="size-3 opacity-70" />
                      {formatDuration(note.timestampSeconds)}
                    </button>
                  )}
                  <div className="flex items-center gap-1">
                    {!isEditing && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => {
                          setEditingId(note.id);
                          setEditHtml(note.content);
                          setEditTimestamp(note.timestampSeconds);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-destructive hover:text-destructive"
                      disabled={busyId === note.id}
                      onClick={() => void deleteNote(note.id)}
                    >
                      {busyId === note.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <NotesRichEditor
                      key={`edit-${note.id}`}
                      content={editHtml}
                      onChange={setEditHtml}
                      autofocus
                      minHeightClass="min-h-[140px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(null);
                          setEditHtml("");
                        }}
                      >
                        Batal
                      </Button>
                      <Button
                        size="sm"
                        className="btn-primary"
                        disabled={busyId === note.id || !noteHasVisibleContent(editHtml)}
                        onClick={() => void saveEdit(note.id)}
                      >
                        {busyId === note.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        Simpan
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn("prose-notes text-foreground/90")}
                    dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(note.content) }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

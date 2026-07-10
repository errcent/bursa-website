"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  MessageSquare,
  Pencil,
  Pin,
  PinOff,
  Send,
  ThumbsUp,
  Trash2,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LessonQuestion } from "@/lib/lesson-qa/types";

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatRelativeDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isMentorAuthor(role: string) {
  const normalized = role.toUpperCase();
  return normalized === "MENTOR" || normalized === "ADMIN";
}

interface LessonQaPanelProps {
  courseSlug: string;
  lessonId: string;
  playheadSeconds: number;
  onSeek?: (seconds: number) => void;
}

export function LessonQaPanel({
  courseSlug,
  lessonId,
  playheadSeconds,
  onSeek,
}: LessonQaPanelProps) {
  const { session } = useAuth();
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draftQuestion, setDraftQuestion] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<"top" | "newest">("top");

  const isMentor = session?.role === "mentor" || session?.role === "admin";

  const apiBase = `/api/courses/${courseSlug}/lessons/${lessonId}/questions`;

  const authPayload = useMemo(() => {
    if (!session) return null;
    return {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
    };
  }, [session]);

  const loadQuestions = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (!opts?.soft) setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (session?.email) params.set("email", session.email);
        if (session?.userId) params.set("userId", session.userId);
        const qs = params.toString();
        const res = await fetch(`${apiBase}${qs ? `?${qs}` : ""}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          setQuestions([]);
          setError("Gagal memuat komentar.");
          return;
        }
        const data = await res.json();
        setQuestions(data.questions ?? []);
        setError(null);
      } catch {
        setQuestions([]);
        setError("Gagal memuat komentar.");
      } finally {
        setIsLoading(false);
      }
    },
    [apiBase, session?.email, session?.userId]
  );

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const sortedQuestions = useMemo(() => {
    const list = [...questions];
    list.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (sort === "top") {
        if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [questions, sort]);

  async function submitQuestion() {
    if (!draftQuestion.trim() || !authPayload) {
      if (!authPayload) setError("Masuk terlebih dahulu untuk berkomentar.");
      return;
    }

    setSubmittingQuestion(true);
    setError(null);

    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...authPayload,
          content: draftQuestion.trim(),
          timestampSeconds: Math.floor(playheadSeconds),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Gagal mengirim komentar.");
        return;
      }

      const data = await res.json();
      setQuestions((prev) => [data.question, ...prev]);
      setDraftQuestion("");
    } catch {
      setError("Gagal mengirim komentar. Coba lagi.");
    } finally {
      setSubmittingQuestion(false);
    }
  }

  async function submitReply(questionId: string) {
    const content = replyDrafts[questionId]?.trim();
    if (!content || !authPayload) {
      if (!authPayload) setError("Masuk untuk membalas komentar.");
      return;
    }

    setSubmittingReplyId(questionId);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/${questionId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...authPayload, content }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Gagal mengirim balasan.");
        return;
      }

      const data = await res.json();
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, replies: [...q.replies, data.reply] } : q
        )
      );
      setReplyDrafts((prev) => ({ ...prev, [questionId]: "" }));
    } catch {
      setError("Gagal mengirim balasan. Coba lagi.");
    } finally {
      setSubmittingReplyId(null);
    }
  }

  async function toggleLike(questionId: string) {
    if (!authPayload) {
      setError("Masuk untuk menyukai komentar.");
      return;
    }
    setBusyId(questionId);
    try {
      const res = await fetch(`${apiBase}/${questionId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authPayload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Gagal memperbarui like.");
        return;
      }
      const data = await res.json();
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? data.question : q))
      );
    } catch {
      setError("Gagal memperbarui like.");
    } finally {
      setBusyId(null);
    }
  }

  async function togglePin(question: LessonQuestion) {
    if (!authPayload) return;
    setBusyId(question.id);
    try {
      const res = await fetch(`${apiBase}/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...authPayload, isPinned: !question.isPinned }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Gagal menyematkan komentar.");
        return;
      }
      const data = await res.json();
      setQuestions((prev) =>
        prev.map((q) => (q.id === question.id ? data.question : q))
      );
    } catch {
      setError("Gagal menyematkan komentar.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveEdit(questionId: string) {
    if (!authPayload || !editDraft.trim()) return;
    setBusyId(questionId);
    try {
      const res = await fetch(`${apiBase}/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...authPayload, content: editDraft.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Gagal mengedit komentar.");
        return;
      }
      const data = await res.json();
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? data.question : q))
      );
      setEditingId(null);
      setEditDraft("");
    } catch {
      setError("Gagal mengedit komentar.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteComment(questionId: string) {
    if (!authPayload) return;
    setBusyId(questionId);
    try {
      const res = await fetch(`${apiBase}/${questionId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authPayload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Gagal menghapus komentar.");
        return;
      }
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch {
      setError("Gagal menghapus komentar.");
    } finally {
      setBusyId(null);
    }
  }

  function canEdit(question: LessonQuestion) {
    if (!session) return false;
    return question.isMine || isMentor;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "…" : `${questions.length} komentar`}
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={sort === "top" ? "secondary" : "ghost"}
            className="h-7 text-xs"
            onClick={() => setSort("top")}
          >
            Teratas
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sort === "newest" ? "secondary" : "ghost"}
            className="h-7 text-xs"
            onClick={() => setSort("newest")}
          >
            Terbaru
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <input
          value={draftQuestion}
          onChange={(e) => setDraftQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submitQuestion();
            }
          }}
          placeholder={
            session
              ? `Tulis komentar di ${formatDuration(playheadSeconds)}...`
              : "Masuk untuk berkomentar..."
          }
          disabled={!session || submittingQuestion}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/30 disabled:opacity-60"
        />
        <Button
          size="sm"
          onClick={() => void submitQuestion()}
          disabled={!session || submittingQuestion || !draftQuestion.trim()}
          className="btn-primary"
        >
          {submittingQuestion ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MessageSquare className="size-4" />
          )}
          Kirim
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat komentar...
        </div>
      ) : sortedQuestions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada komentar untuk lesson ini. Jadilah yang pertama berkomentar —
          mentor dan peserta lain dapat membalas di sini.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sortedQuestions.map((question) => (
            <li
              key={question.id}
              className={cn(
                "rounded-lg border border-border bg-card p-3 text-sm",
                question.isPinned && "border-accent/40 bg-accent/5"
              )}
            >
              <div className="flex gap-3">
                {question.timestampSeconds != null && (
                  <button
                    type="button"
                    onClick={() => onSeek?.(question.timestampSeconds!)}
                    className="h-fit shrink-0 rounded bg-foreground/10 px-2 py-0.5 font-mono text-xs hover:bg-foreground/20"
                    title="Lompat ke timestamp ini"
                  >
                    {formatDuration(question.timestampSeconds)}
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {question.isPinned && (
                      <Badge variant="secondary" className="gap-1 text-[10px] uppercase">
                        <Pin className="size-2.5" /> Disematkan
                      </Badge>
                    )}
                    <span className="font-medium">{question.user.nama}</span>
                    {isMentorAuthor(question.user.role) && (
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        Mentor
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeDate(question.createdAt)}
                      {question.edited ? " · diedit" : ""}
                    </span>
                  </div>

                  {editingId === question.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-foreground/30"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="btn-primary"
                          disabled={busyId === question.id || !editDraft.trim()}
                          onClick={() => void saveEdit(question.id)}
                        >
                          Simpan
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditDraft("");
                          }}
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{question.content}</p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "h-7 gap-1 px-2 text-xs",
                        question.likedByMe && "text-foreground"
                      )}
                      disabled={!session || busyId === question.id}
                      onClick={() => void toggleLike(question.id)}
                    >
                      <ThumbsUp
                        className={cn("size-3.5", question.likedByMe && "fill-current")}
                      />
                      {question.likeCount > 0 ? question.likeCount : "Suka"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      disabled={!session}
                      onClick={() =>
                        setReplyDrafts((prev) => ({
                          ...prev,
                          [question.id]: prev[question.id] ?? "",
                        }))
                      }
                    >
                      Balas
                    </Button>
                    {canEdit(question) && editingId !== question.id && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => {
                          setEditingId(question.id);
                          setEditDraft(question.content);
                        }}
                      >
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                    )}
                    {isMentor && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 px-2 text-xs"
                        disabled={busyId === question.id}
                        onClick={() => void togglePin(question)}
                      >
                        {question.isPinned ? (
                          <>
                            <PinOff className="size-3.5" /> Lepas pin
                          </>
                        ) : (
                          <>
                            <Pin className="size-3.5" /> Sematkan
                          </>
                        )}
                      </Button>
                    )}
                    {canEdit(question) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 px-2 text-xs text-destructive"
                        disabled={busyId === question.id}
                        onClick={() => void deleteComment(question.id)}
                      >
                        <Trash2 className="size-3.5" /> Hapus
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {question.replies.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2 border-l-2 border-foreground/10 pl-3">
                  {question.replies.map((reply) => (
                    <li key={reply.id} className="text-sm">
                      <div className="mb-0.5 flex flex-wrap items-center gap-2">
                        <span className="font-medium">{reply.user.nama}</span>
                        {isMentorAuthor(reply.user.role) && (
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            Mentor
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeDate(reply.createdAt)}
                          {reply.edited ? " · diedit" : ""}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{reply.content}</p>
                    </li>
                  ))}
                </ul>
              )}

              {session && replyDrafts[question.id] !== undefined && (
                <div className="mt-3 flex items-start gap-2">
                  <input
                    value={replyDrafts[question.id] ?? ""}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({
                        ...prev,
                        [question.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void submitReply(question.id);
                      }
                    }}
                    placeholder={
                      isMentor ? "Tulis balasan mentor..." : "Tulis balasan..."
                    }
                    disabled={submittingReplyId === question.id}
                    className={cn(
                      "flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none",
                      "placeholder:text-muted-foreground focus:border-foreground/30"
                    )}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void submitReply(question.id)}
                    disabled={
                      submittingReplyId === question.id ||
                      !replyDrafts[question.id]?.trim()
                    }
                  >
                    {submittingReplyId === question.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

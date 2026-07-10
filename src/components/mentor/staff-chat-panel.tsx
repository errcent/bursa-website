"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

type StaffMessage = {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userName: string;
  isMine: boolean;
};

type ApiMessage = {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user?: { id: string; nama: string };
};

interface StaffChatPanelProps {
  roomId: string;
  currentUserId: string;
  className?: string;
  pollMs?: number;
}

function mapMessages(raw: ApiMessage[], currentUserId: string): StaffMessage[] {
  return raw.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: typeof m.createdAt === "string" ? m.createdAt : new Date(m.createdAt).toISOString(),
    userId: m.userId,
    userName: m.user?.nama ?? "Pengguna",
    isMine: m.userId === currentUserId,
  }));
}

function authHeaders(): HeadersInit {
  const session = getSession();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.email) headers["x-user-email"] = session.email;
  if (session?.userId) headers["x-user-id"] = session.userId;
  if (session?.name) headers["x-user-name"] = session.name;
  if (session?.role) headers["x-user-role"] = session.role;
  return headers;
}

export function StaffChatPanel({
  roomId,
  currentUserId,
  className,
  pollMs = 3000,
}: StaffChatPanelProps) {
  const [messages, setMessages] = useState<StaffMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages?limit=80`, {
        cache: "no-store",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Gagal memuat pesan.");
      const data = (await res.json()) as { messages?: ApiMessage[] };
      setMessages(mapMessages(data.messages ?? [], currentUserId));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat pesan.");
    } finally {
      setLoading(false);
    }
  }, [roomId, currentUserId]);

  useEffect(() => {
    load();
    const id = window.setInterval(load, pollMs);
    return () => window.clearInterval(id);
  }, [load, pollMs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          userId: currentUserId,
          content,
          messageType: "TEXT",
        }),
      });
      if (!res.ok) {
        let message = "Gagal mengirim pesan.";
        try {
          const body = (await res.json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          /* keep default */
        }
        throw new Error(message);
      }
      setDraft("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={cn("flex h-[420px] flex-col overflow-hidden rounded-xl border border-border", className)}>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Memuat percakapan...
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada pesan. Mulai koordinasi di sini.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex flex-col gap-0.5", m.isMine ? "items-end" : "items-start")}
            >
              <p className="text-[11px] text-muted-foreground">
                {m.userName}
                <span className="mx-1">·</span>
                {new Date(m.createdAt).toLocaleString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "numeric",
                  month: "short",
                })}
              </p>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  m.isMine
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="border-t border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-3">
        <input
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          placeholder="Tulis pesan ke admin/mentor..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={sending}
        />
        <Button type="submit" size="sm" disabled={sending || !draft.trim()}>
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Kirim
        </Button>
      </form>
    </div>
  );
}

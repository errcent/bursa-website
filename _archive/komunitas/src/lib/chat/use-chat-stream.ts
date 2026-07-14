"use client";

import { useEffect, useRef, useState } from "react";

import { getSession } from "@/lib/auth/client";

const MAX_RETRIES = 5;
const BASE_RETRY_MS = 2000;

function authHeaders(): HeadersInit {
  const session = getSession();
  if (!session) return {};
  const headers: Record<string, string> = {
    Accept: "text/event-stream",
    "x-user-email": session.email,
    "x-user-id": session.userId,
  };
  if (session.name) headers["x-user-name"] = session.name;
  if (session.role) headers["x-user-role"] = session.role;
  return headers;
}

function parseSseBlock(block: string): { event: string; data: string } {
  let event = "message";
  let data = "";
  for (const line of block.split("\n")) {
    if (line.startsWith("event: ")) event = line.slice(7).trim();
    else if (line.startsWith("data: ")) data = line.slice(6);
  }
  return { event, data };
}

async function consumeSseStream(
  response: Response,
  onEvent: (event: string, data: string) => void,
  signal: AbortSignal
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (!signal.aborted) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      if (block.trim()) {
        const parsed = parseSseBlock(block);
        onEvent(parsed.event, parsed.data);
      }
      boundary = buffer.indexOf("\n\n");
    }
  }
}

export type UseChatStreamOptions = {
  roomId: string;
  branchId?: string | null;
  enabled?: boolean;
  onUpdate: () => void;
};

export type UseChatStreamResult = {
  /** True when SSE is connected and receiving events. */
  isStreaming: boolean;
};

export function useChatStream({
  roomId,
  branchId,
  enabled = true,
  onUpdate,
}: UseChatStreamOptions): UseChatStreamResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setIsStreaming(false);
      return;
    }

    const abort = new AbortController();
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let retryCount = 0;
    let active = true;

    const cleanup = () => {
      active = false;
      abort.abort();
      if (retryTimer) clearTimeout(retryTimer);
      setIsStreaming(false);
    };

    const scheduleRetry = (permanent: boolean) => {
      if (!active) return;
      setIsStreaming(false);

      if (permanent || retryCount >= MAX_RETRIES) return;

      const delay = BASE_RETRY_MS * Math.pow(1.5, retryCount);
      retryCount += 1;
      retryTimer = setTimeout(() => {
        if (active) void run();
      }, delay);
    };

    const run = async () => {
      if (!active) return;

      const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
      let response: Response;
      try {
        response = await fetch(`/api/chat/rooms/${roomId}/stream${q}`, {
          headers: authHeaders(),
          cache: "no-store",
          signal: abort.signal,
        });
      } catch {
        if (!abort.signal.aborted) scheduleRetry(false);
        return;
      }

      if (!active) return;

      if (!response.ok) {
        scheduleRetry(response.status === 401 || response.status === 403);
        return;
      }

      retryCount = 0;
      setIsStreaming(true);

      try {
        await consumeSseStream(
          response,
          (event) => {
            if (event === "update") {
              onUpdateRef.current();
            }
          },
          abort.signal
        );
      } catch {
        /* aborted or network drop */
      }

      if (!abort.signal.aborted) {
        scheduleRetry(false);
      }
    };

    void run();

    return cleanup;
  }, [roomId, branchId, enabled]);

  return { isStreaming };
}

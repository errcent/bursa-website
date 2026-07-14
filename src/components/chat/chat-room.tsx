"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Loader2,
  Megaphone,
  Pin,
  Radio,
  Search,
  Settings,
  Users,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { ChannelSearch } from "@/components/chat/channel-search";
import { ChatInput } from "@/components/chat/chat-input";
import {
  GroupSettingsSheet,
  MemberProfileSheet,
} from "@/components/chat/group-settings-sheet";
import { MemberList } from "@/components/chat/member-list";
import { MessageBubble } from "@/components/chat/message-bubble";
import { PinnedMessages } from "@/components/chat/pinned-messages";
import { ProtectedContent } from "@/components/chat/protected-content";
import { SignalComposeModal } from "@/components/chat/signal-compose-modal";
import { PollComposeModal } from "@/components/chat/poll-compose-modal";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { UnreadDivider } from "@/components/chat/unread-divider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { extractMentionedUserIds } from "@/lib/chat/mention-utils";
import { generateEmbedsFromText } from "@/lib/chat/link-preview";
import { getMessageGroupMeta } from "@/lib/chat/message-grouping";
import { fetchRoomMembers, joinChatRoom, markChatRoomRead } from "@/lib/chat/api";
import { getSession } from "@/lib/auth/client";
import { canMutateAdmin } from "@/lib/auth/roles";
import { mapApiChatMessage, mapApiChatMessages } from "@/lib/chat/map-api-message";
import {
  branchModeLabel,
  isOneWayMode,
  isTwoWayMode,
  pickDefaultBranchId,
} from "@/lib/chat/room-kinds";
import { safeRoomCount } from "@/lib/chat/room-counts";
import type {
  ChatBranchInfo,
  ChatMember,
  ChatMessage,
  ChatRoom,
  ComposePollInput,
  ComposeSignalInput,
  PendingAttachment,
  TypingUser,
} from "@/lib/chat/types";
import type { ScreenshotAttemptMethod } from "@/lib/chat/anti-screenshot";

const POLL_INTERVAL_MS = 4000;
const POLL_INTERVAL_MOBILE_MS = 10000;
const TYPING_SIMULATION_INTERVAL_MS = 8000;
const NEAR_BOTTOM_PX = 80;

function getPollIntervalMs() {
  if (typeof window === "undefined") return POLL_INTERVAL_MS;
  return window.matchMedia("(max-width: 768px)").matches
    ? POLL_INTERVAL_MOBILE_MS
    : POLL_INTERVAL_MS;
}

function pollScopeKey(roomId: string, branchId?: string | null) {
  return `${roomId}:${branchId ?? ""}`;
}

function messagesSnapshotKey(messages: ChatMessage[]): string {
  return messages
    .map(
      (m) =>
        `${m.id}:${m.createdAt}:${m.content.length}:${m.poll?.votedOptionId ?? ""}:${m.reactions?.map((r) => `${r.emoji}:${r.count}`).join(",") ?? ""}`
    )
    .join("|");
}

/** Client-side guard: never render messages from another cabang or room. */
function filterMessagesForScope(
  messages: ChatMessage[],
  roomId: string,
  branchId?: string | null,
  hasBranches = false
): ChatMessage[] {
  return messages.filter((m) => {
    if (m.roomId && m.roomId !== roomId) return false;
    if (!hasBranches) return true;
    if (!branchId) return m.branchId == null;
    return m.branchId === branchId;
  });
}

function scrollListToBottom(el: HTMLElement, instant: boolean) {
  if (instant) {
    el.scrollTop = el.scrollHeight;
  } else {
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }
}

interface ChatRoomProps {
  room: ChatRoom;
  className?: string;
  /** Called after the room is marked read (e.g. refresh sidebar unread badges). */
  onMarkedRead?: () => void;
}

async function fetchMessages(
  roomId: string,
  branchId?: string | null,
  currentUserId?: string | null,
  ownUserIds?: readonly string[] | null
): Promise<{
  messages: ChatMessage[];
  lastReadMessageId: string | null;
  historyHidden: boolean;
  viewerId: string | null;
} | null> {
  try {
    const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
    const session = getSession();
    const headers: HeadersInit = {};
    if (session?.email) headers["x-user-email"] = session.email;
    if (session?.userId) headers["x-user-id"] = session.userId;
    if (session?.name) headers["x-user-name"] = session.name;
    if (session?.role) headers["x-user-role"] = session.role;
    const res = await fetch(`/api/chat/rooms/${roomId}/messages${q}`, {
      cache: "no-store",
      headers,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const viewerId =
      typeof data.viewerId === "string" && data.viewerId.trim()
        ? data.viewerId.trim()
        : null;
    const mapAs = viewerId ?? currentUserId ?? session?.userId;
    const viewerIds = [
      ...new Set(
        [viewerId, ...(ownUserIds ?? []), currentUserId, session?.userId].filter(
          (id): id is string => Boolean(id && id !== "guest")
        )
      ),
    ];
    const raw = Array.isArray(data.messages)
      ? data.messages
      : Array.isArray(data)
        ? data
        : [];
    return {
      messages: mapApiChatMessages(raw, mapAs, viewerIds),
      lastReadMessageId:
        typeof data.lastReadMessageId === "string" ? data.lastReadMessageId : null,
      historyHidden: Boolean(data.historyHidden),
      viewerId,
    };
  } catch {
    return null;
  }
}

function canSendInActiveBranch(
  branch: ChatBranchInfo | null | undefined,
  isMentor: boolean,
  isModerator: boolean,
  isDeveloper: boolean
): { allowed: boolean; reason?: string } {
  if (!branch) return { allowed: true };
  if (branch.visibility === "private") {
    if (isDeveloper) {
      return { allowed: false, reason: "Developer tidak dapat mengakses cabang privat." };
    }
    if (!isMentor && !isModerator) {
      return {
        allowed: false,
        reason: "Cabang privat — hanya mentor dan moderator.",
      };
    }
  }
  // Members may always send on 2-arah; senderPolicy is ONE_WAY-only.
  if (isTwoWayMode(branch.mode)) return { allowed: true };
  if (isMentor) return { allowed: true };
  if (branch.senderPolicy === "mentor_and_moderators" && isModerator) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason:
      branch.senderPolicy === "mentor_and_moderators"
        ? "Cabang 1 arah — hanya mentor dan moderator yang dapat mengirim."
        : "Cabang 1 arah — hanya mentor yang dapat mengirim.",
  };
}

function logScreenshotAttempt(
  userId: string,
  userName: string,
  roomId: string,
  method: ScreenshotAttemptMethod
) {
  const event = {
    userId,
    userName,
    roomId,
    timestamp: new Date().toISOString(),
    method,
  };
  console.info("[audit] screenshot attempt", event);

  try {
    const key = "bursa-screenshot-audit";
    const existing = JSON.parse(localStorage.getItem(key) ?? "[]");
    existing.push(event);
    localStorage.setItem(key, JSON.stringify(existing.slice(-50)));
  } catch {
    /* ignore storage errors */
  }
}

function buildAttachmentFromPending(att: PendingAttachment) {
  return {
    id: att.id,
    name: att.file.name,
    url: att.previewUrl ?? "#",
    type: att.type,
    size: att.file.size,
  };
}

function isNearBottom(el: HTMLElement) {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX;
}

function prefersInstantScroll() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}

export function ChatRoomView({
  room: initialRoom,
  className,
  onMarkedRead,
}: ChatRoomProps) {
  const { session } = useAuth();
  const [room, setRoom] = useState<ChatRoom>(initialRoom);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyHidden, setHistoryHidden] = useState(false);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(
    () =>
      initialRoom.activeBranchId ??
      pickDefaultBranchId(initialRoom.branches, { preferTwoWay: true })
  );
  const [isPolling, setIsPolling] = useState(false);
  const pollGenerationRef = useRef(0);
  const activePollScopeRef = useRef("");
  const branchLoadInFlightRef = useRef(false);
  const pollInFlightRef = useRef(false);
  const branchMessagesCacheRef = useRef<Map<string, ChatMessage[]>>(new Map());
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [replyFocusKey, setReplyFocusKey] = useState(0);
  const [signalModalOpen, setSignalModalOpen] = useState(false);
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileMember, setProfileMember] = useState<ChatMember | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [lastSentAt, setLastSentAt] = useState<number>(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  /** Prisma User.id from API — client session.userId is often a different localStorage id. */
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const skipScrollOnNextLengthChangeRef = useRef(false);
  /** Freeze divider cursor for this visit so mark-read does not hide "Pesan baru". */
  const unreadDividerFrozenRef = useRef(false);
  const markCurrentRoomReadRef = useRef<() => Promise<void>>(async () => {});

  const pinned = useMemo(
    () => messages.filter((m) => m.isPinned),
    [messages]
  );
  const isMentor =
    session?.role === "mentor" || (session?.email?.includes("mentor") ?? false);
  const isDeveloper = session?.role === "developer";
  const isAdmin = canMutateAdmin(session?.role);
  /** Prefer Prisma viewer id so isOwn matches server-authored messages. */
  const currentUserId = viewerUserId ?? session?.userId ?? "guest";
  const ownUserIds = useMemo(() => {
    const ids = new Set<string>();
    if (viewerUserId) ids.add(viewerUserId);
    if (session?.userId) ids.add(session.userId);
    return [...ids];
  }, [viewerUserId, session?.userId]);
  /** Latest viewer ids for fetches — must not retrigger branch reload when Prisma id arrives. */
  const fetchViewerRef = useRef({ currentUserId, ownUserIds });
  fetchViewerRef.current = { currentUserId, ownUserIds };
  const currentMember = members.find(
    (m) => m.id === currentUserId || (session?.userId != null && m.id === session.userId)
  );
  const isModerator = currentMember?.role === "moderator";
  const visibleBranches = useMemo(() => {
    const all = room.branches ?? [];
    return all.filter((b) => {
      if (b.visibility !== "private") return true;
      if (isDeveloper) return false;
      return isMentor || isModerator;
    });
  }, [room.branches, isDeveloper, isMentor, isModerator]);
  /** Single source of truth — UI tab, fetch, poll, and send must all use this id. */
  const effectiveBranchId = useMemo(() => {
    if (visibleBranches.length === 0) return activeBranchId;
    if (activeBranchId && visibleBranches.some((b) => b.id === activeBranchId)) {
      return activeBranchId;
    }
    return pickDefaultBranchId(visibleBranches, { preferTwoWay: true });
  }, [activeBranchId, visibleBranches]);
  const activeBranch =
    visibleBranches.find((b) => b.id === effectiveBranchId) ??
    visibleBranches[0] ??
    null;
  const hasBranches = visibleBranches.length > 0;
  const branchSend = canSendInActiveBranch(
    activeBranch,
    isMentor,
    isModerator,
    isDeveloper
  );
  // Public rooms: anyone can post. Mentor hubs: follow active branch mode
  // (TWO_WAY = members; ONE_WAY = mentor/mod only). Do not gate the whole
  // composer on isMentor — that would block 2-arah for learners.
  const canPost =
    (!room.isReadOnly || isMentor) &&
    (room.roomKind === "public" || !visibleBranches.length || branchSend.allowed);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return messages.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.author.name.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  const unreadIndex = useMemo(() => {
    if (!room.lastReadMessageId) return -1;
    const idx = messages.findIndex((m) => m.id === room.lastReadMessageId);
    return idx >= 0 ? idx + 1 : -1;
  }, [messages, room.lastReadMessageId]);

  const pollMessages = useCallback(async () => {
    if (branchLoadInFlightRef.current || pollInFlightRef.current) return;
    if (typeof document !== "undefined" && document.hidden) return;

    const branchForPoll = effectiveBranchId;
    const scopeKey = pollScopeKey(room.id, branchForPoll);
    const generationAtStart = pollGenerationRef.current;
    activePollScopeRef.current = scopeKey;
    pollInFlightRef.current = true;

    const { currentUserId: viewerId, ownUserIds: viewerIds } =
      fetchViewerRef.current;
    let remote: Awaited<ReturnType<typeof fetchMessages>> = null;
    try {
      remote = await fetchMessages(room.id, branchForPoll, viewerId, viewerIds);
    } finally {
      pollInFlightRef.current = false;
    }

    if (generationAtStart !== pollGenerationRef.current) return;
    if (activePollScopeRef.current !== scopeKey) return;

    if (remote) {
      if (remote.viewerId) setViewerUserId(remote.viewerId);
      const scopedRemote = filterMessagesForScope(
        remote.messages,
        room.id,
        branchForPoll,
        hasBranches
      );
      setMessages((prev) => {
        const scopedPrev = filterMessagesForScope(
          prev,
          room.id,
          branchForPoll,
          hasBranches
        );
        const pending = scopedPrev.filter((m) => m.id.startsWith("local-"));
        const viewerIds = fetchViewerRef.current.ownUserIds;
        if (pending.length === 0) {
          if (messagesSnapshotKey(scopedPrev) === messagesSnapshotKey(scopedRemote)) {
            return scopedPrev;
          }
          return scopedRemote;
        }

        const stillPending = pending.filter((local) => {
          if (
            local.branchId &&
            branchForPoll &&
            local.branchId !== branchForPoll
          ) {
            return false;
          }
          if (local.type === "signal" && local.signal) {
            const s = local.signal;
            return !scopedRemote.some(
              (r) =>
                r.type === "signal" &&
                r.signal?.ticker === s.ticker &&
                r.signal.direction === s.direction &&
                r.signal.entry === s.entry &&
                r.signal.target === s.target &&
                r.signal.stopLoss === s.stopLoss
            );
          }
          if (local.type === "poll" && local.poll) {
            return !scopedRemote.some(
              (r) => r.type === "poll" && r.poll?.question === local.poll?.question
            );
          }
          return !scopedRemote.some(
            (r) =>
              r.content === local.content &&
              (r.author.id === local.author.id ||
                viewerIds.includes(r.author.id)) &&
              Math.abs(
                new Date(r.createdAt).getTime() - new Date(local.createdAt).getTime()
              ) < 15_000
          );
        });

        const merged =
          stillPending.length === 0
            ? scopedRemote
            : [...scopedRemote, ...stillPending];

        const next = merged.map((remoteMsg) => {
          const local = scopedPrev.find((m) => m.id === remoteMsg.id);
          let next = remoteMsg;

          if (
            next.type === "poll" &&
            next.poll &&
            local?.poll?.votedOptionId &&
            !next.poll.votedOptionId
          ) {
            next = {
              ...next,
              poll: {
                ...next.poll,
                votedOptionId: local.poll.votedOptionId,
                totalVotes: Math.max(
                  next.poll.totalVotes,
                  local.poll.totalVotes
                ),
                options: next.poll.options.map((opt) => {
                  const localOpt = local.poll!.options.find((o) => o.id === opt.id);
                  if (!localOpt) return opt;
                  return {
                    ...opt,
                    votes: Math.max(opt.votes, localOpt.votes),
                  };
                }),
              },
            };
          }

          if (local?.reactions?.some((r) => r.userReacted)) {
            const remoteReactions = next.reactions ?? [];
            const byEmoji = new Map(
              remoteReactions.map((r) => [r.emoji, { ...r }])
            );
            for (const lr of local.reactions) {
              if (!lr.userReacted) continue;
              const remoteReaction = byEmoji.get(lr.emoji);
              if (!remoteReaction) {
                byEmoji.set(lr.emoji, { ...lr });
              } else if (!remoteReaction.userReacted) {
                byEmoji.set(lr.emoji, {
                  emoji: lr.emoji,
                  count: Math.max(remoteReaction.count + 1, lr.count),
                  userReacted: true,
                });
              }
            }
            const mergedReactions = [...byEmoji.values()].filter((r) => r.count > 0);
            next = {
              ...next,
              reactions: mergedReactions.length > 0 ? mergedReactions : undefined,
            };
          }

          return next;
        });

        if (messagesSnapshotKey(next) === messagesSnapshotKey(scopedPrev)) {
          return scopedPrev;
        }
        return next;
      });
      setHistoryHidden(remote.historyHidden);
      if (!unreadDividerFrozenRef.current && remote.lastReadMessageId) {
        unreadDividerFrozenRef.current = true;
        setRoom((prev) =>
          prev.lastReadMessageId === remote.lastReadMessageId
            ? prev
            : { ...prev, lastReadMessageId: remote.lastReadMessageId ?? undefined }
        );
      }
    }
  }, [room.id, effectiveBranchId, hasBranches]);

  const loadMembers = useCallback(async () => {
    const remote = await fetchRoomMembers(room.id);
    if (remote) {
      const mentorSlug = room.mentorSlug;
      const normalized = remote.map((m) =>
        mentorSlug && m.profileSlug === mentorSlug && m.role !== "mentor"
          ? { ...m, role: "mentor" as const }
          : m
      );
      setMembers(normalized);
      setRoom((prev) =>
        prev.onlineCount === normalized.length
          ? prev
          : { ...prev, onlineCount: normalized.length }
      );
    }
  }, [room.id, room.mentorSlug]);

  const markCurrentRoomRead = useCallback(async () => {
    if (!session?.userId) return;
    const result = await markChatRoomRead(room.id);
    if (!result) return;
    setRoom((prev) => ({
      ...prev,
      unreadCount: 0,
      mentionUnreadCount: 0,
      hasMention: false,
      branches: prev.branches?.map((b) => ({
        ...b,
        unreadCount: 0,
        mentionUnreadCount: 0,
        hasMention: false,
      })),
    }));
    onMarkedRead?.();
  }, [room.id, session?.userId, onMarkedRead]);

  markCurrentRoomReadRef.current = markCurrentRoomRead;

  useEffect(() => {
    setRoom(initialRoom);
    setMembers([]);
    setMessages([]);
    setHistoryHidden(false);
    setViewerUserId(null);
    setActiveBranchId(
      initialRoom.activeBranchId ??
        pickDefaultBranchId(initialRoom.branches, { preferTwoWay: true })
    );
    setSendError(null);
    stickToBottomRef.current = true;
    unreadDividerFrozenRef.current = false;
    pollGenerationRef.current += 1;
    activePollScopeRef.current = "";
    branchLoadInFlightRef.current = false;
    pollInFlightRef.current = false;
    branchMessagesCacheRef.current.clear();
  }, [initialRoom]);

  useEffect(() => {
    if (
      effectiveBranchId &&
      effectiveBranchId !== activeBranchId &&
      visibleBranches.some((b) => b.id === effectiveBranchId)
    ) {
      setActiveBranchId(effectiveBranchId);
    }
  }, [effectiveBranchId, activeBranchId, visibleBranches]);

  // Join room + load members + mark read. Message load is owned by the branch
  // effect so cabang switches and viewer-id resolution never race here.
  useEffect(() => {
    let cancelled = false;
    async function syncMembershipAndMembers() {
      if (session?.userId) {
        try {
          await joinChatRoom(room.id);
        } catch {
          // Hub may require enrollment; still load whatever members exist.
        }
      }
      if (cancelled) return;
      await loadMembers();
      if (cancelled) return;
      await markCurrentRoomReadRef.current();
    }
    void syncMembershipAndMembers();
    return () => {
      cancelled = true;
    };
  }, [room.id, session?.userId, loadMembers]);

  // Re-mark as read while the tab is focused and the user is near the bottom
  // (actively viewing the latest messages).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!stickToBottomRef.current) return;
      void markCurrentRoomReadRef.current();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    // Branch switches: allow a fresh divider cursor for the new thread.
    unreadDividerFrozenRef.current = false;
    pollGenerationRef.current += 1;
    const branchForLoad = effectiveBranchId;
    const scopeKey = pollScopeKey(room.id, branchForLoad);
    const generation = pollGenerationRef.current;
    activePollScopeRef.current = scopeKey;
    branchLoadInFlightRef.current = true;
    setIsPolling(true);

    const cached = branchMessagesCacheRef.current.get(scopeKey);
    setMessages(cached ?? []);

    let cancelled = false;
    void (async () => {
      const { currentUserId: viewerId, ownUserIds: viewerIds } =
        fetchViewerRef.current;
      const remote = await fetchMessages(
        room.id,
        branchForLoad,
        viewerId,
        viewerIds
      );
      if (cancelled || generation !== pollGenerationRef.current) return;
      if (activePollScopeRef.current !== scopeKey) return;
      if (remote) {
        if (remote.viewerId) setViewerUserId(remote.viewerId);
        const scoped = filterMessagesForScope(
          remote.messages,
          room.id,
          branchForLoad,
          hasBranches
        );
        branchMessagesCacheRef.current.set(scopeKey, scoped);
        setMessages(scoped);
        setHistoryHidden(remote.historyHidden);
        if (!unreadDividerFrozenRef.current && remote.lastReadMessageId) {
          unreadDividerFrozenRef.current = true;
          setRoom((prev) => ({
            ...prev,
            lastReadMessageId: remote.lastReadMessageId ?? undefined,
          }));
        }
      }
      if (!cancelled) {
        branchLoadInFlightRef.current = false;
        setIsPolling(false);
      }
    })();

    return () => {
      cancelled = true;
      branchLoadInFlightRef.current = false;
    };
  }, [effectiveBranchId, room.id, hasBranches]);

  useEffect(() => {
    if (branchLoadInFlightRef.current) return;
    const key = pollScopeKey(room.id, effectiveBranchId);
    // Only cache when the active poll scope matches — avoids writing stale
    // messages from a previous cabang into the new branch key on fast switches.
    if (activePollScopeRef.current !== key) return;
    const scoped = filterMessagesForScope(
      messages,
      room.id,
      effectiveBranchId,
      hasBranches
    );
    branchMessagesCacheRef.current.set(key, scoped);
  }, [messages, room.id, effectiveBranchId, hasBranches]);

  useEffect(() => {
    const tick = () => {
      if (document.hidden) return;
      void pollMessages();
    };
    const interval = window.setInterval(tick, getPollIntervalMs());
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void pollMessages();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pollMessages]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    if (skipScrollOnNextLengthChangeRef.current) {
      skipScrollOnNextLengthChangeRef.current = false;
      return;
    }

    if (stickToBottomRef.current) {
      scrollListToBottom(el, prefersInstantScroll());
    }
  }, [messages.length]);

  useEffect(() => {
    const otherMembers = members.filter((m) => m.isOnline && m.id !== currentUserId);
    if (otherMembers.length === 0) return;

    const simulateTyping = () => {
      if (Math.random() > 0.4) {
        const count = Math.random() > 0.7 ? 2 : 1;
        const selected = otherMembers
          .sort(() => Math.random() - 0.5)
          .slice(0, count)
          .map((m) => ({ id: m.id, name: m.name.split(" ")[0] }));
        setTypingUsers(selected);
        window.setTimeout(() => setTypingUsers([]), 3000);
      }
    };

    const interval = window.setInterval(simulateTyping, TYPING_SIMULATION_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [members, currentUserId]);

  const handleListScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = isNearBottom(el);
    const wasNearBottom = stickToBottomRef.current;
    stickToBottomRef.current = nearBottom;
    // User scrolled to latest messages — clear unread for list badges.
    if (nearBottom && !wasNearBottom) {
      void markCurrentRoomReadRef.current();
    }
  };

  const startReply = (message: ChatMessage) => {
    setReplyTo(message);
    setReplyFocusKey((k) => k + 1);
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (messageId.startsWith("local-")) return;

    let previous: ChatMessage["reactions"];

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        previous = msg.reactions;
        const reactions = [...(msg.reactions ?? [])];
        const existing = reactions.find((r) => r.emoji === emoji);
        if (existing?.userReacted) {
          existing.count = Math.max(0, existing.count - 1);
          existing.userReacted = false;
          return {
            ...msg,
            reactions: reactions.filter((r) => r.count > 0),
          };
        }
        if (existing) {
          existing.count += 1;
          existing.userReacted = true;
        } else {
          reactions.push({ emoji, count: 1, userReacted: true });
        }
        return { ...msg, reactions };
      })
    );

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (session?.email) headers["x-user-email"] = session.email;
    if (session?.userId) headers["x-user-id"] = session.userId;
    if (session?.name) headers["x-user-name"] = session.name;
    if (session?.role) headers["x-user-role"] = session.role;

    void fetch(`/api/chat/rooms/${room.id}/messages/${messageId}/react`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        userId: session?.userId ?? currentUserId,
        emoji,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId ? { ...msg, reactions: previous } : msg
            )
          );
          return;
        }
        const data = (await res.json().catch(() => null)) as {
          reaction?: { userId?: string; user?: { id?: string } };
        } | null;
        const prismaUserId =
          data?.reaction?.userId ?? data?.reaction?.user?.id ?? null;
        if (prismaUserId && prismaUserId !== currentUserId) {
          setViewerUserId(prismaUserId);
        }
      })
      .catch(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, reactions: previous } : msg
          )
        );
      });
  };

  const handleEdit = (messageId: string, content: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              content,
              editedAt: new Date().toISOString(),
              embeds: generateEmbedsFromText(content),
            }
          : msg
      )
    );
  };

  const handleDelete = (messageId: string) => {
    const removeFromState = () => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    };

    if (!isAdmin) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isDeleted: true, content: "" } : msg
        )
      );
      return;
    }

    removeFromState();

    const headers: HeadersInit = {};
    if (session?.email) headers["x-user-email"] = session.email;
    if (session?.userId) headers["x-user-id"] = session.userId;
    if (session?.name) headers["x-user-name"] = session.name;
    if (session?.role) headers["x-user-role"] = session.role;

    void fetch(`/api/chat/rooms/${room.id}/messages/${messageId}`, {
      method: "DELETE",
      headers,
    }).then((res) => {
      if (!res.ok) {
        void pollMessages();
      }
    }).catch(() => {
      void pollMessages();
    });
  };

  const handleSend = async (content: string, attachments?: PendingAttachment[]) => {
    if (!canPost) return;
    setSendError(null);
    const embeds = generateEmbedsFromText(content);
    const mentions = extractMentionedUserIds(content, members);

    // Keep viewport stable when sending — never force-scroll on send
    skipScrollOnNextLengthChangeRef.current = true;

    const branchIdForSend = effectiveBranchId;
    const newMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      roomId: room.id,
      branchId: branchIdForSend ?? null,
      type: "text",
      content,
      author: {
        id: currentUserId,
        name: session?.name ?? "Anda",
        initials: (session?.name ?? "A").slice(0, 2).toUpperCase(),
        role: isMentor ? "mentor" : "member",
        isOnline: true,
      },
      createdAt: new Date().toISOString(),
      replyTo: replyTo
        ? {
            id: replyTo.id,
            authorName: replyTo.author?.name ?? "Pengguna",
            preview: (replyTo.content ?? "").slice(0, 60),
          }
        : undefined,
      mentions: mentions.length > 0 ? mentions : undefined,
      embeds: embeds.length > 0 ? embeds : undefined,
      attachments: attachments?.map(buildAttachmentFromPending),
    };
    const replyToId = replyTo?.id;
    setMessages((prev) => [...prev, newMsg]);
    setReplyTo(null);
    setLastSentAt(Date.now());

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.email) headers["x-user-email"] = session.email;
      if (session?.userId) headers["x-user-id"] = session.userId;
      if (session?.name) headers["x-user-name"] = session.name;
      if (session?.role) headers["x-user-role"] = session.role;
      const res = await fetch(`/api/chat/rooms/${room.id}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          // Prefer session id; API resolves to Prisma User via email headers
          userId: session?.userId ?? currentUserId,
          content,
          messageType: "TEXT",
          ...(branchIdForSend ? { branchId: branchIdForSend } : {}),
          ...(replyToId ? { replyToId } : {}),
          ...(mentions.length > 0 ? { mentions } : {}),
        }),
      });
      if (!res.ok) {
        // Drop optimistic bubble on failure; next poll restores server truth
        setMessages((prev) => prev.filter((m) => m.id !== newMsg.id));
        const errBody = await res.json().catch(() => null);
        const apiError =
          (errBody as { error?: string } | null)?.error ??
          (res.status === 500
            ? "Server error saat mengirim. Coba lagi sebentar."
            : "Gagal mengirim pesan. Coba lagi.");
        setSendError(apiError);
        return;
      }
      const data = await res.json().catch(() => null);
      const raw = data?.message ?? data;
      if (raw?.id) {
        const confirmed = mapApiChatMessage(raw, currentUserId, ownUserIds);
        if (confirmed.author?.id && confirmed.author.id !== currentUserId) {
          setViewerUserId(confirmed.author.id);
        }
        // Keep client-only fields the API does not round-trip yet
        if (newMsg.attachments?.length) confirmed.attachments = newMsg.attachments;
        if (newMsg.embeds?.length) confirmed.embeds = newMsg.embeds;
        if (newMsg.mentions?.length) confirmed.mentions = newMsg.mentions;
        // Prefer optimistic reply preview if API omitted nested replyTo
        if (!confirmed.replyTo && newMsg.replyTo) confirmed.replyTo = newMsg.replyTo;
        setMessages((prev) =>
          prev.map((m) => (m.id === newMsg.id ? confirmed : m))
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== newMsg.id));
      setSendError("Gagal mengirim pesan. Periksa koneksi Anda.");
    }
  };

  const handleSignalSubmit = (signal: ComposeSignalInput) => {
    skipScrollOnNextLengthChangeRef.current = true;
    setSendError(null);

    const localId = `local-sig-${Date.now()}`;
    const branchIdForSend = effectiveBranchId;
    const newMsg: ChatMessage = {
      id: localId,
      roomId: room.id,
      branchId: branchIdForSend ?? null,
      type: "signal",
      content: `Setup ${signal.direction} $${signal.ticker}`,
      author: {
        id: currentUserId,
        name: session?.name ?? "Anda",
        initials: (session?.name ?? "A").slice(0, 2).toUpperCase(),
        role: "mentor",
        isOnline: true,
      },
      createdAt: new Date().toISOString(),
      signal: {
        id: `sig-${Date.now()}`,
        ...signal,
        status: "ACTIVE",
      },
    };
    setMessages((prev) => [...prev, newMsg]);
    setLastSentAt(Date.now());

    const mentorId = room.mentorId;
    if (!session?.userId || !mentorId) {
      setMessages((prev) => prev.filter((m) => m.id !== localId));
      setSendError(
        !mentorId
          ? "Ruang ini belum terhubung ke profil mentor."
          : "Sesi tidak valid. Masuk ulang untuk mengirim sinyal."
      );
      return;
    }

    const instrumentApi =
      signal.instrument === "Crypto"
        ? "CRYPTO"
        : signal.instrument === "Forex"
          ? "FOREX"
          : "SAHAM";

    void fetch("/api/trading/signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: room.id,
        mentorId,
        ...(branchIdForSend ? { branchId: branchIdForSend } : {}),
        ticker: signal.ticker,
        instrument: instrumentApi,
        direction: signal.direction,
        entryPrice: signal.entry,
        targetPrice: signal.target,
        stopLoss: signal.stopLoss,
        rationale: signal.note,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          setMessages((prev) => prev.filter((m) => m.id !== localId));
          const errBody = await res.json().catch(() => null);
          setSendError(
            (errBody as { error?: string } | null)?.error ??
              "Gagal mengirim sinyal. Coba lagi."
          );
          return;
        }
        const data = await res.json().catch(() => null);
        const raw = data?.message;
        if (raw?.id) {
          const confirmed = mapApiChatMessage(raw, currentUserId, ownUserIds);
          // Never lose compose values if the round-trip map is incomplete
          if (!confirmed.signal && newMsg.signal) confirmed.signal = newMsg.signal;
          setMessages((prev) => {
            if (prev.some((m) => m.id === confirmed.id)) {
              return prev.filter((m) => m.id !== localId);
            }
            return prev.map((m) => (m.id === localId ? confirmed : m));
          });
          return;
        }
        const createdId = data?.signal?.id as string | undefined;
        if (createdId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === localId && msg.signal
                ? { ...msg, signal: { ...msg.signal, id: createdId } }
                : msg
            )
          );
        }
      })
      .catch(() => {
        setMessages((prev) => prev.filter((m) => m.id !== localId));
        setSendError("Gagal mengirim sinyal. Periksa koneksi Anda.");
      });
  };

  const handlePollSubmit = (poll: ComposePollInput) => {
    skipScrollOnNextLengthChangeRef.current = true;
    setSendError(null);

    const localId = `local-poll-${Date.now()}`;
    const branchIdForSend = effectiveBranchId;
    const options = poll.options.map((label, index) => ({
      id: `opt-${index + 1}`,
      label,
      votes: 0,
    }));
    const endsAt =
      poll.durationHours != null
        ? new Date(Date.now() + poll.durationHours * 60 * 60 * 1000).toISOString()
        : undefined;

    const newMsg: ChatMessage = {
      id: localId,
      roomId: room.id,
      branchId: branchIdForSend ?? null,
      type: "poll",
      content: poll.question,
      author: {
        id: currentUserId,
        name: session?.name ?? "Anda",
        initials: (session?.name ?? "A").slice(0, 2).toUpperCase(),
        role: isMentor ? "mentor" : "member",
        isOnline: true,
      },
      createdAt: new Date().toISOString(),
      poll: {
        question: poll.question,
        options,
        totalVotes: 0,
        endsAt,
      },
    };
    setMessages((prev) => [...prev, newMsg]);
    setLastSentAt(Date.now());

    if (!session?.userId) {
      setMessages((prev) => prev.filter((m) => m.id !== localId));
      setSendError("Sesi tidak valid. Masuk ulang untuk mengirim polling.");
      return;
    }

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (session.email) headers["x-user-email"] = session.email;
    if (session.userId) headers["x-user-id"] = session.userId;
    if (session.name) headers["x-user-name"] = session.name;
    if (session.role) headers["x-user-role"] = session.role;

    void fetch("/api/trading/polls", {
      method: "POST",
      headers,
      body: JSON.stringify({
        roomId: room.id,
        userId: session.userId,
        ...(branchIdForSend ? { branchId: branchIdForSend } : {}),
        question: poll.question,
        options: poll.options,
        durationHours: poll.durationHours ?? null,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          setMessages((prev) => prev.filter((m) => m.id !== localId));
          const errBody = await res.json().catch(() => null);
          setSendError(
            (errBody as { error?: string } | null)?.error ??
              "Gagal mengirim polling. Coba lagi."
          );
          return;
        }
        const data = await res.json().catch(() => null);
        if (typeof data?.viewerId === "string" && data.viewerId.trim()) {
          setViewerUserId(data.viewerId.trim());
        }
        const raw = data?.message;
        if (raw?.id) {
          const confirmed = mapApiChatMessage(
            raw,
            (typeof data?.viewerId === "string" ? data.viewerId : null) ??
              currentUserId,
            ownUserIds
          );
          if (!confirmed.poll && newMsg.poll) confirmed.poll = newMsg.poll;
          setMessages((prev) => {
            if (prev.some((m) => m.id === confirmed.id)) {
              return prev.filter((m) => m.id !== localId);
            }
            return prev.map((m) => (m.id === localId ? confirmed : m));
          });
          return;
        }
        const createdId = data?.poll?.id as string | undefined;
        if (createdId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === localId && msg.poll
                ? { ...msg, poll: { ...msg.poll, id: createdId } }
                : msg
            )
          );
        }
      })
      .catch(() => {
        setMessages((prev) => prev.filter((m) => m.id !== localId));
        setSendError("Gagal mengirim polling. Periksa koneksi Anda.");
      });
  };

  const handlePollVote = (messageId: string, optionId: string) => {
    const target = messages.find((m) => m.id === messageId);
    const previousPoll = target?.poll;
    const pollId = previousPoll?.id;

    if (!previousPoll) return;
    if (previousPoll.votedOptionId) return;

    if (!pollId) {
      setSendError("Polling belum siap. Muat ulang lalu coba vote lagi.");
      return;
    }

    if (!session?.userId) {
      setSendError("Sesi tidak valid. Masuk ulang untuk vote.");
      return;
    }

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId || !msg.poll) return msg;
        if (msg.poll.votedOptionId) return msg;

        const options = msg.poll.options.map((opt) =>
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        );
        return {
          ...msg,
          poll: {
            ...msg.poll,
            options,
            totalVotes: msg.poll.totalVotes + 1,
            votedOptionId: optionId,
          },
        };
      })
    );

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (session.email) headers["x-user-email"] = session.email;
    if (session.userId) headers["x-user-id"] = session.userId;
    if (session.name) headers["x-user-name"] = session.name;
    if (session.role) headers["x-user-role"] = session.role;

    void fetch(`/api/trading/polls/${pollId}/vote`, {
      method: "POST",
      headers,
      body: JSON.stringify({ userId: session.userId, optionId }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (typeof data?.viewerId === "string" && data.viewerId.trim()) {
          setViewerUserId(data.viewerId.trim());
        }

        if (!res.ok) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId && msg.poll
                ? { ...msg, poll: previousPoll }
                : msg
            )
          );
          const err =
            (data as { error?: string } | null)?.error ??
            "Gagal mencatat suara. Coba lagi.";
          if (res.status === 400 && /already voted/i.test(err)) {
            void pollMessages();
            return;
          }
          setSendError(err);
          return;
        }

        const pollPayload = data?.poll as
          | {
              options?: Array<{ id: string; label: string; votes: number }>;
              totalVotes?: number;
            }
          | undefined;
        if (pollPayload?.options && Array.isArray(pollPayload.options)) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== messageId || !msg.poll) return msg;
              const options = pollPayload.options!.map((opt) => ({
                id: opt.id,
                label: opt.label,
                votes: opt.votes,
              }));
              return {
                ...msg,
                poll: {
                  ...msg.poll,
                  options,
                  totalVotes:
                    typeof pollPayload.totalVotes === "number"
                      ? pollPayload.totalVotes
                      : options.reduce((s, o) => s + o.votes, 0),
                  votedOptionId: optionId,
                  id: msg.poll.id ?? pollId,
                },
              };
            })
          );
        }
      })
      .catch(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId && msg.poll
              ? { ...msg, poll: previousPoll }
              : msg
          )
        );
        setSendError("Gagal mencatat suara. Periksa koneksi Anda.");
      });
  };

  const handleRoomUpdate = (patch: Partial<ChatRoom>) => {
    setRoom((prev) => {
      const next = { ...prev, ...patch };
      if (patch.isLive && !prev.isLive) {
        skipScrollOnNextLengthChangeRef.current = true;
        const announce: ChatMessage = {
          id: `local-live-${Date.now()}`,
          roomId: prev.id,
          branchId: effectiveBranchId ?? null,
          type: "announcement",
          content: `🔴 Mentor sedang live${patch.liveTitle ? `: ${patch.liveTitle}` : ""}`,
          author: {
            id: currentUserId,
            name: session?.name ?? "Mentor",
            initials: (session?.name ?? "M").slice(0, 2).toUpperCase(),
            role: "mentor",
            isOnline: true,
          },
          createdAt: new Date().toISOString(),
        };
        setMessages((msgs) => [...msgs, announce]);
      }
      return next;
    });
  };

  const scrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({
        behavior: prefersInstantScroll() ? "auto" : "smooth",
        block: "center",
      });
      setHighlightedId(messageId);
      window.setTimeout(() => setHighlightedId(null), 2000);
    }
    setShowSearch(false);
    setSearchQuery("");
  };

  const handleScreenshotAttempt = useCallback(
    (method: ScreenshotAttemptMethod) => {
      if (!session) return;
      logScreenshotAttempt(session.userId, session.name, room.id, method);
    },
    [session, room.id]
  );

  const messagesPanel = (
    <>
      <div className="shrink-0">
        <PinnedMessages
          messages={pinned}
          onJumpTo={(id) => scrollToMessage(id)}
        />

        {showSearch && (
          <ChannelSearch
            query={searchQuery}
            onQueryChange={setSearchQuery}
            results={searchResults}
            onSelect={scrollToMessage}
            onClose={() => {
              setShowSearch(false);
              setSearchQuery("");
            }}
          />
        )}
      </div>

      <div
        ref={listRef}
        onScroll={handleListScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-2 sm:px-2"
      >
        <div className="mb-2 flex flex-col items-center justify-center gap-1 py-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center">
            <Loader2 className={cn("mr-2 size-3", isPolling && "animate-spin")} />
            Scroll ke atas untuk muat lebih banyak (segera)
          </span>
          {historyHidden && (
            <span className="text-center text-[11px] text-muted-foreground/80">
              Riwayat sebelum Anda bergabung disembunyikan
            </span>
          )}
        </div>

        {messages.length === 0 && !isPolling && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {historyHidden
              ? "Belum ada pesan sejak Anda bergabung."
              : "Belum ada pesan di ruang ini."}
          </p>
        )}

        {messages.map((msg, index) => {
          const group = getMessageGroupMeta(
            messages[index - 1],
            msg,
            messages[index + 1]
          );
          return (
            <div key={msg.id}>
              {index === unreadIndex && unreadIndex > 0 && <UnreadDivider />}
              <MessageBubble
                message={msg}
                currentUserId={currentUserId}
                ownUserIds={ownUserIds}
                isAdmin={isAdmin}
                isReplyTarget={highlightedId === msg.id}
                group={group}
                onReply={startReply}
                onReact={handleReact}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPollVote={handlePollVote}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0">
        <TypingIndicator users={typingUsers} />
      </div>
    </>
  );

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}>
      {/* Chrome stays outside the message scroller so title/tabs never leave the panel */}
      <div className="z-20 shrink-0 border-b border-border/60 bg-card">
        <header className="flex items-center justify-between gap-2 px-3 py-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              render={<Link href="/komunitas" />}
              nativeButton={false}
              variant="ghost"
              size="icon-sm"
              className="shrink-0 lg:hidden"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-heading text-base font-semibold">{room.name}</h1>
                {room.isLive && (
                  <Badge
                    variant="outline"
                    className="h-5 gap-1 border-rose-500/40 bg-rose-500/10 px-1.5 text-[10px] text-rose-600 dark:text-rose-400"
                  >
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-60" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-rose-500" />
                    </span>
                    LIVE
                  </Badge>
                )}
                {room.channelType === "announcement" && (
                  <Badge variant="outline" className="h-5 gap-0.5 px-1.5 text-[10px]">
                    <Megaphone className="size-2.5" />
                    Pengumuman
                  </Badge>
                )}
                {room.slowModeSeconds && room.slowModeSeconds > 0 && (
                  <Badge variant="outline" className="h-5 gap-0.5 px-1.5 text-[10px]">
                    <Clock className="size-2.5" />
                    Lambat {room.slowModeSeconds}s
                  </Badge>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {room.isLive && room.liveTitle
                  ? `${room.liveTitle} · `
                  : ""}
                {safeRoomCount(room.onlineCount)} online · {room.mentorName}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {room.isLive && (
              <span
                className="mr-1 hidden items-center gap-1 text-[10px] font-medium text-rose-600 sm:inline-flex dark:text-rose-400"
                title={room.liveTitle ?? "Mentor live"}
              >
                <Radio className="size-3.5" />
                Live
              </span>
            )}
            {pinned.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => scrollToMessage(pinned[0].id)}
                aria-label="Pesan disematkan"
                title={`${pinned.length} pesan disematkan`}
              >
                <Pin className="size-4 text-accent" />
              </Button>
            )}
            <Button
              type="button"
              variant={showSearch ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setShowSearch((v) => !v)}
              aria-label="Cari pesan"
            >
              <Search className="size-4" />
            </Button>

            {isMentor && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setSettingsOpen(true)}
                aria-label="Pengaturan grup"
                title="Pengaturan grup"
              >
                <Settings className="size-4" />
              </Button>
            )}

            <Sheet
              onOpenChange={(open) => {
                if (open) void loadMembers();
              }}
            >
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Daftar anggota" />
                }
              >
                <Users className="size-4" />
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle>
                    Anggota Ruang
                    {members.length > 0 ? ` (${members.length})` : ""}
                  </SheetTitle>
                </SheetHeader>
                <MemberList
                  members={members}
                  mentorSlug={room.mentorSlug}
                  className="px-2"
                  onMemberClick={(m) => setProfileMember(m)}
                />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {visibleBranches.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 px-3 py-2">
            {visibleBranches.map((branch) => {
              const active = branch.id === effectiveBranchId;
              const branchUnread = safeRoomCount(branch.unreadCount);
              const branchHasMention =
                branch.hasMention === true ||
                safeRoomCount(branch.mentionUnreadCount) > 0;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => {
                    setActiveBranchId(branch.id);
                    setSendError(null);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {branch.name}
                  <span className="opacity-80">
                    · {branchModeLabel(branch.mode)}
                    {branch.visibility === "private" ? " · Privat" : ""}
                  </span>
                  {!active && branchHasMention && (
                    <span
                      className="inline-flex size-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400"
                      title="Ada mention untuk Anda"
                      aria-label="Ada mention belum dibaca"
                    >
                      @
                    </span>
                  )}
                  {!active && branchUnread > 0 && (
                    <span
                      className="inline-flex min-w-4 justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground"
                      title="Pesan baru"
                      aria-label={`${branchUnread} pesan baru`}
                    >
                      {branchUnread > 99 ? "99+" : String(branchUnread)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {room.isProtected && session ? (
          <ProtectedContent
            userId={session.userId}
            userName={session.name}
            roomId={room.id}
            onScreenshotAttempt={handleScreenshotAttempt}
            className="min-h-0 flex-1"
          >
            {messagesPanel}
          </ProtectedContent>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{messagesPanel}</div>
        )}

        {!canPost && (
          <p className="hidden shrink-0 border-t border-border bg-muted/40 px-4 py-2 text-center text-xs text-muted-foreground sm:block">
            {branchSend.reason ??
              (isOneWayMode(activeBranch?.mode)
                ? "Cabang 1 arah — hanya mentor yang dapat mengirim."
                : "Anda tidak dapat mengirim di cabang ini.")}
          </p>
        )}
        {sendError && canPost && (
          <p className="shrink-0 border-t border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-xs text-destructive">
            {sendError}
          </p>
        )}

        <div className="shrink-0">
          <ChatInput
            onSend={handleSend}
            onSignalCompose={isMentor ? () => setSignalModalOpen(true) : undefined}
            onPollCompose={isMentor ? () => setPollModalOpen(true) : undefined}
            isMentor={isMentor}
            members={members}
            replyTo={
              replyTo
                ? { authorName: replyTo.author.name, preview: replyTo.content.slice(0, 60) }
                : null
            }
            onCancelReply={() => setReplyTo(null)}
            replyFocusKey={replyFocusKey}
            readOnly={!canPost}
            readOnlyMessage={
              !canPost
                ? branchSend.reason ??
                  (isOneWayMode(activeBranch?.mode)
                    ? "Cabang 1 arah — hanya mentor yang dapat mengirim."
                    : "Anda tidak dapat mengirim di cabang ini.")
                : undefined
            }
            placeholder={
              !canPost && isOneWayMode(activeBranch?.mode)
                ? "Cabang 1 arah — hanya baca"
                : isTwoWayMode(activeBranch?.mode)
                  ? "Ketik pesan di cabang 2 arah..."
                  : undefined
            }
            slowModeSeconds={room.slowModeSeconds}
            lastSentAt={lastSentAt}
            onTyping={() => {
              /* local typing state — no broadcast in mock */
            }}
          />
        </div>
      </div>

      <SignalComposeModal
        open={signalModalOpen}
        onOpenChange={setSignalModalOpen}
        onSubmit={handleSignalSubmit}
      />

      {isMentor && (
        <PollComposeModal
          open={pollModalOpen}
          onOpenChange={setPollModalOpen}
          onSubmit={handlePollSubmit}
        />
      )}

      {isMentor && (
        <GroupSettingsSheet
          open={settingsOpen}
          onOpenChange={(open) => {
            setSettingsOpen(open);
            if (open) void loadMembers();
          }}
          room={room}
          members={members}
          currentUserId={currentUserId}
          onRoomUpdate={handleRoomUpdate}
          onMembersChange={setMembers}
          onMemberClick={(m) => {
            setSettingsOpen(false);
            setProfileMember(m);
          }}
        />
      )}

      <MemberProfileSheet
        member={profileMember}
        open={!!profileMember}
        onOpenChange={(open) => {
          if (!open) setProfileMember(null);
        }}
      />
    </div>
  );
}

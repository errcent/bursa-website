import type { Instrument } from "@/lib/types";
import { mentionedUserIdsFromMetadata } from "@/lib/chat/mention-utils";
import type {
  ChatMember,
  ChatMessage,
  ChatReaction,
  MemberRole,
  MessageType,
  PollData,
  TradingSignal,
} from "@/lib/chat/types";

type ApiUser = {
  id: string;
  nama: string;
  role?: string;
  avatarUrl?: string | null;
  bio?: string | null;
};

type ApiReaction = {
  emoji: string;
  userId?: string;
  user?: { id: string; nama?: string };
};

type ApiMessage = {
  id: string;
  roomId: string;
  branchId?: string | null;
  userId: string;
  content: string;
  messageType?: string;
  metadata?: Record<string, unknown> | null;
  isPinned?: boolean;
  replyToId?: string | null;
  createdAt: string | Date;
  editedAt?: string | Date | null;
  deletedAt?: string | Date | null;
  user?: ApiUser | null;
  reactions?: ApiReaction[];
  replyTo?: {
    id: string;
    content?: string;
    user?: { nama?: string } | null;
  } | null;
};

function roleToMemberRole(role?: string | null): MemberRole {
  const r = (role ?? "").toUpperCase();
  if (r === "MENTOR" || r === "ADMIN") return "mentor";
  if (r === "MODERATOR") return "moderator";
  return "member";
}

function messageTypeToUi(type?: string | null): MessageType {
  switch ((type ?? "TEXT").toUpperCase()) {
    case "SIGNAL":
      return "signal";
    case "POLL":
      return "poll";
    case "ANNOUNCEMENT":
      return "announcement";
    case "SYSTEM":
      return "system";
    default:
      return "text";
  }
}

function initialsFromName(name: string): string {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function mapAuthor(user: ApiUser | null | undefined, userId: string): ChatMember {
  const name = user?.nama?.trim() || "Pengguna";
  return {
    id: user?.id ?? userId,
    name,
    initials: initialsFromName(name),
    role: roleToMemberRole(user?.role),
    isOnline: true,
    avatarUrl: user?.avatarUrl ?? undefined,
    bio: user?.bio ?? undefined,
  };
}

function mapReactions(
  reactions: ApiReaction[] | undefined,
  viewerIds: readonly string[] = []
): ChatReaction[] | undefined {
  if (!reactions?.length) return undefined;
  const byEmoji = new Map<string, ChatReaction>();
  for (const r of reactions) {
    const existing = byEmoji.get(r.emoji);
    const uid = r.userId ?? r.user?.id;
    const reacted = !!uid && viewerIds.includes(uid);
    if (existing) {
      existing.count += 1;
      if (reacted) existing.userReacted = true;
    } else {
      byEmoji.set(r.emoji, {
        emoji: r.emoji,
        count: 1,
        userReacted: reacted || undefined,
      });
    }
  }
  return [...byEmoji.values()];
}

function mapInstrument(value: unknown): Instrument {
  const raw = String(value ?? "").toUpperCase();
  if (raw === "CRYPTO" || raw === "CRYPTOCURRENCY") return "Crypto";
  if (raw === "FOREX") return "Forex";
  return "Saham";
}

function numField(
  metadata: Record<string, unknown>,
  ...keys: string[]
): number {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

function mapSignal(metadata: Record<string, unknown> | null | undefined): TradingSignal | undefined {
  if (!metadata) return undefined;
  const ticker = typeof metadata.ticker === "string" ? metadata.ticker : null;
  const direction = metadata.direction;
  if (!ticker || (direction !== "LONG" && direction !== "SHORT")) return undefined;
  return {
    id: typeof metadata.signalId === "string" ? metadata.signalId : `sig-${ticker}`,
    ticker,
    direction,
    // Prefer API fields; also accept compose-shaped keys so remaps stay faithful
    entry: numField(metadata, "entryPrice", "entry"),
    target: numField(metadata, "targetPrice", "target"),
    stopLoss: numField(metadata, "stopLoss"),
    instrument: mapInstrument(metadata.instrument),
    status: "ACTIVE",
    note:
      typeof metadata.rationale === "string"
        ? metadata.rationale
        : typeof metadata.note === "string"
          ? metadata.note
          : undefined,
  };
}

function normalizeViewerIds(
  currentUserId?: string | null,
  ownUserIds?: readonly string[] | null
): string[] {
  const ids = new Set<string>();
  for (const id of ownUserIds ?? []) {
    if (typeof id === "string" && id.trim() && id !== "guest") ids.add(id.trim());
  }
  if (typeof currentUserId === "string" && currentUserId.trim() && currentUserId !== "guest") {
    ids.add(currentUserId.trim());
  }
  return [...ids];
}

function mapPoll(
  metadata: Record<string, unknown> | null | undefined,
  viewerIds: readonly string[] = []
): PollData | undefined {
  if (!metadata || typeof metadata.question !== "string") return undefined;
  const rawOptions = Array.isArray(metadata.options) ? metadata.options : [];
  // Never trust shared metadata.votedOptionId — it is per-viewer and must not
  // lock out other members when accidentally persisted on the message.
  let votedOptionId: string | undefined;
  const options = rawOptions.map((opt, index) => {
    if (opt && typeof opt === "object") {
      const o = opt as {
        id?: string;
        label?: string;
        votes?: number;
        voterIds?: unknown;
      };
      const id = o.id ?? `opt-${index + 1}`;
      if (
        !votedOptionId &&
        viewerIds.length > 0 &&
        Array.isArray(o.voterIds) &&
        o.voterIds.some(
          (vid) => typeof vid === "string" && viewerIds.includes(vid)
        )
      ) {
        votedOptionId = id;
      }
      return {
        id,
        label: o.label ?? `Opsi ${index + 1}`,
        votes: typeof o.votes === "number" ? o.votes : 0,
      };
    }
    return {
      id: `opt-${index + 1}`,
      label: String(opt),
      votes: 0,
    };
  });
  const totalFromMeta =
    typeof metadata.totalVotes === "number" && Number.isFinite(metadata.totalVotes)
      ? metadata.totalVotes
      : options.reduce((sum, o) => sum + o.votes, 0);
  return {
    id: typeof metadata.pollId === "string" ? metadata.pollId : undefined,
    question: metadata.question,
    options,
    totalVotes: totalFromMeta,
    endsAt: typeof metadata.endsAt === "string" ? metadata.endsAt : undefined,
    votedOptionId,
  };
}

/** Map Prisma/API chat message payload to the client ChatMessage shape. */
export function mapApiChatMessage(
  raw: ApiMessage,
  currentUserId?: string | null,
  ownUserIds?: readonly string[] | null
): ChatMessage {
  const type = messageTypeToUi(raw.messageType);
  const metadata =
    raw.metadata && typeof raw.metadata === "object"
      ? (raw.metadata as Record<string, unknown>)
      : null;
  const viewerIds = normalizeViewerIds(currentUserId, ownUserIds);

  const mentions = mentionedUserIdsFromMetadata(metadata);

  return {
    id: raw.id,
    roomId: raw.roomId,
    branchId: raw.branchId ?? null,
    type,
    content: raw.content ?? "",
    author: mapAuthor(raw.user, raw.userId),
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date(raw.createdAt).toISOString(),
    editedAt: raw.editedAt
      ? typeof raw.editedAt === "string"
        ? raw.editedAt
        : new Date(raw.editedAt).toISOString()
      : undefined,
    isPinned: raw.isPinned || undefined,
    isDeleted: !!raw.deletedAt || undefined,
    replyTo: raw.replyTo
      ? {
          id: raw.replyTo.id,
          authorName: raw.replyTo.user?.nama ?? "Pengguna",
          preview: (raw.replyTo.content ?? "").slice(0, 60),
        }
      : undefined,
    reactions: mapReactions(raw.reactions, viewerIds),
    signal: type === "signal" ? mapSignal(metadata) : undefined,
    poll: type === "poll" ? mapPoll(metadata, viewerIds) : undefined,
    mentions: mentions.length > 0 ? mentions : undefined,
  };
}

export function mapApiChatMessages(
  raw: unknown[],
  currentUserId?: string | null,
  ownUserIds?: readonly string[] | null
): ChatMessage[] {
  return raw.map((item) =>
    mapApiChatMessage(item as ApiMessage, currentUserId, ownUserIds)
  );
}

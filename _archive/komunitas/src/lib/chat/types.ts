import type { Instrument } from "@/lib/types";

export type ChannelCategory = "Publik" | "Internal" | "Komunitas" | "Trading";

export type RoomTier = "Pemula" | "Menengah" | "Mahir";

/** @deprecated Use ChannelCategory */
export type RoomCategory = RoomTier | "Internal";

export type MemberRole = "mentor" | "moderator" | "member";

export type ChannelType = "text" | "announcement";

export type RoomKind = "public" | "mentor_community" | "mentor_internal";

export type BranchMode = "one_way" | "two_way";

export type BranchSenderPolicy = "mentor_only" | "mentor_and_moderators";

/** Public = members; private = mentor/moderator only (developers blocked). */
export type BranchVisibility = "public" | "private";

export interface ChatBranchInfo {
  id: string;
  slug: string;
  name: string;
  description?: string;
  mode: BranchMode;
  senderPolicy: BranchSenderPolicy;
  visibility: BranchVisibility;
  sortOrder: number;
  isActive: boolean;
  /** Unread messages in this branch (from others after lastReadAt). */
  unreadCount?: number;
  /** Unread messages in this branch that @mention the viewer. */
  mentionUnreadCount?: number;
  /** True when mentionUnreadCount > 0. */
  hasMention?: boolean;
}

export type SignalDirection = "LONG" | "SHORT";

export type SignalStatus = "ACTIVE" | "CLOSED";

export type MessageType = "text" | "signal" | "poll" | "announcement" | "system";

export type AttachmentType = "image" | "pdf" | "file";

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: AttachmentType;
  size?: number;
}

export interface MessageEmbed {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  color?: string;
}

export interface TradingSignal {
  id: string;
  ticker: string;
  direction: SignalDirection;
  entry: number;
  target: number;
  stopLoss: number;
  instrument: Instrument;
  status: SignalStatus;
  note?: string;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface PollData {
  id?: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  endsAt?: string;
  /** Option id the current user voted for (client-side) */
  votedOptionId?: string;
}

export interface ComposePollInput {
  question: string;
  options: string[];
  /** Hours until poll closes; omit for no expiry */
  durationHours?: number;
}

export interface ChatReaction {
  emoji: string;
  count: number;
  userReacted?: boolean;
}

export interface ChatMember {
  id: string;
  name: string;
  initials: string;
  role: MemberRole;
  isOnline: boolean;
  avatarUrl?: string;
  username?: string;
  /** Mentor public profile slug → /instruktur/[slug] */
  profileSlug?: string;
  bio?: string;
}

export interface ReplyRef {
  id: string;
  authorName: string;
  preview: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  /** Mentor hub cabang; used to keep optimistic bubbles on the branch that sent them. */
  branchId?: string | null;
  type: MessageType;
  content: string;
  author: ChatMember;
  createdAt: string;
  editedAt?: string;
  isPinned?: boolean;
  isDeleted?: boolean;
  replyTo?: ReplyRef;
  signal?: TradingSignal;
  poll?: PollData;
  reactions?: ChatReaction[];
  attachments?: MessageAttachment[];
  embeds?: MessageEmbed[];
  mentions?: string[];
}

export interface ChatRoom {
  id: string;
  slug: string;
  name: string;
  description: string;
  channelCategory: ChannelCategory;
  roomKind: RoomKind;
  tier?: RoomTier;
  channelType?: ChannelType;
  isProtected: boolean;
  unreadCount: number;
  /** Unread messages that @mention the current viewer (subset of unread). */
  mentionUnreadCount?: number;
  /** True when mentionUnreadCount > 0 — drives "@" badge in room lists. */
  hasMention?: boolean;
  onlineCount: number;
  /** Mentor profile id when room is mentor-owned */
  mentorId?: string;
  mentorSlug: string;
  mentorName: string;
  mentorInitials: string;
  mentorAvatarUrl?: string;
  slowModeSeconds?: number;
  isReadOnly?: boolean;
  lastReadMessageId?: string;
  /** Mentor is currently live in this room */
  isLive?: boolean;
  liveStartedAt?: string;
  liveTitle?: string;
  branches?: ChatBranchInfo[];
  /** Active branch when viewing a mentor hub */
  activeBranchId?: string;
  /** @deprecated Use channelCategory */
  category?: RoomCategory;
}

export interface TypingUser {
  id: string;
  name: string;
}

export interface ScreenshotAuditEvent {
  userId: string;
  userName: string;
  roomId: string;
  timestamp: string;
  method: "screen-capture" | "visibility" | "devtools" | "context-menu";
}

export interface ComposeSignalInput {
  ticker: string;
  direction: SignalDirection;
  entry: number;
  target: number;
  stopLoss: number;
  instrument: Instrument;
  note?: string;
}

export interface PendingAttachment {
  id: string;
  file: File;
  previewUrl?: string;
  type: AttachmentType;
}

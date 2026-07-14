import type { ChatMember } from "./types";

const USERNAME_PATTERN = /@([a-zA-Z0-9_]+)/g;

export function memberToUsername(member: ChatMember): string {
  if (member.username) return member.username;
  return member.name
    .split(/[\s,]+/)[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function findMentionQuery(text: string, cursor: number): string | null {
  const before = text.slice(0, cursor);
  const match = before.match(/@([a-zA-Z0-9_]*)$/);
  return match ? match[1] : null;
}

export function filterMembersForMention(
  members: ChatMember[],
  query: string
): ChatMember[] {
  const q = query.toLowerCase();
  return members
    .filter((m) => {
      const username = memberToUsername(m);
      return (
        username.startsWith(q) ||
        m.name.toLowerCase().includes(q)
      );
    })
    .slice(0, 8);
}

export function insertMention(
  text: string,
  cursor: number,
  member: ChatMember
): { text: string; cursor: number } {
  const before = text.slice(0, cursor);
  const after = text.slice(cursor);
  const username = memberToUsername(member);
  const replaced = before.replace(/@[a-zA-Z0-9_]*$/, `@${username} `);
  const next = replaced + after;
  return { text: next, cursor: replaced.length };
}

export function extractMentionedUserIds(
  text: string,
  members: ChatMember[]
): string[] {
  const ids = new Set<string>();
  let match: RegExpExecArray | null;
  const regex = new RegExp(USERNAME_PATTERN);
  while ((match = regex.exec(text)) !== null) {
    const username = match[1].toLowerCase();
    const member = members.find(
      (m) => memberToUsername(m).toLowerCase() === username
    );
    if (member) ids.add(member.id);
  }
  return Array.from(ids);
}

/** Username tokens used when @-mentioning a user (matches member list / input UX). */
export function mentionTokensForName(name: string, username?: string | null): string[] {
  const tokens = new Set<string>();
  if (username?.trim()) {
    tokens.add(username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""));
  }
  const first = name
    .split(/[\s,]+/)[0]
    ?.toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  if (first) tokens.add(first);
  return [...tokens].filter(Boolean);
}

/** Read structured mention user ids from message metadata when present. */
export function mentionedUserIdsFromMetadata(
  metadata: unknown
): string[] {
  if (!metadata || typeof metadata !== "object") return [];
  const raw = (metadata as Record<string, unknown>).mentions;
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === "string" && id.length > 0);
}

/**
 * Whether a message @mentions the viewer.
 * Prefers metadata.mentions (user ids); falls back to @token match in content.
 */
export function messageMentionsViewer(input: {
  content: string;
  metadata?: unknown;
  viewerUserId: string;
  viewerMentionTokens: string[];
}): boolean {
  const ids = mentionedUserIdsFromMetadata(input.metadata);
  if (ids.length > 0) {
    return ids.includes(input.viewerUserId);
  }
  if (input.viewerMentionTokens.length === 0) return false;
  const regex = new RegExp(USERNAME_PATTERN);
  let match: RegExpExecArray | null;
  const tokens = new Set(input.viewerMentionTokens.map((t) => t.toLowerCase()));
  while ((match = regex.exec(input.content)) !== null) {
    if (tokens.has(match[1].toLowerCase())) return true;
  }
  return false;
}

export function parseMentionsInText(text: string): Array<{ type: "text" | "mention"; value: string }> {
  const parts: Array<{ type: "text" | "mention"; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(USERNAME_PATTERN);

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "mention", value: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", value: text }];
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
import { voteTradingPollSchema } from "@/lib/validations/api";
import type { Prisma } from "@prisma/client";

type RouteContext = {
  params: Promise<{ pollId: string }>;
};

type PollOptionRecord = {
  id: string;
  label: string;
  votes: number;
  voterIds?: string[];
};

function asOptions(raw: unknown): PollOptionRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const opt = item as Partial<PollOptionRecord>;
    return {
      id: typeof opt.id === "string" ? opt.id : `opt-${index + 1}`,
      label: typeof opt.label === "string" ? opt.label : String(opt),
      votes: typeof opt.votes === "number" ? opt.votes : 0,
      voterIds: Array.isArray(opt.voterIds)
        ? opt.voterIds.filter((id): id is string => typeof id === "string")
        : [],
    };
  });
}

function serializeOptions(options: PollOptionRecord[]) {
  return options.map(({ id, label, votes, voterIds }) => ({
    id,
    label,
    votes,
    voterIds: voterIds ?? [],
  }));
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { pollId } = await context.params;
    const body = voteTradingPollSchema.parse(await request.json());

    const email = request.headers.get("x-user-email")?.trim().toLowerCase();
    const user = await resolveRequestUser(
      {
        userId:
          body.userId?.trim() ||
          request.headers.get("x-user-id")?.trim() ||
          email ||
          "",
        email: email || undefined,
        name: request.headers.get("x-user-name")?.trim() || undefined,
        role: request.headers.get("x-user-role")?.trim() || undefined,
      },
      { createIfMissing: true }
    );
    if (!user) {
      return jsonError("User not found", 404);
    }

    // Atomic read-modify-write so concurrent voters (3+) do not clobber each other.
    const result = await db.$transaction(async (tx) => {
      const poll = await tx.tradingPoll.findUnique({ where: { id: pollId } });
      if (!poll) {
        return { error: "Poll not found" as const, status: 404 as const };
      }

      if (poll.expiresAt && poll.expiresAt.getTime() < Date.now()) {
        return { error: "Poll has expired" as const, status: 400 as const };
      }

      const membership = await tx.chatRoomMember.findUnique({
        where: { roomId_userId: { roomId: poll.roomId, userId: user.id } },
      });
      if (!membership) {
        return {
          error: "You must be a room member to vote" as const,
          status: 403 as const,
        };
      }

      const options = asOptions(poll.options);
      const target = options.find((o) => o.id === body.optionId);
      if (!target) {
        return { error: "Option not found" as const, status: 404 as const };
      }

      const alreadyVoted = options.some((o) => o.voterIds?.includes(user.id));
      if (alreadyVoted) {
        return {
          error: "You already voted on this poll" as const,
          status: 400 as const,
        };
      }

      const nextOptions = options.map((o) => {
        if (o.id !== body.optionId) return o;
        return {
          ...o,
          votes: o.votes + 1,
          voterIds: [...(o.voterIds ?? []), user.id],
        };
      });

      const totalVotes = nextOptions.reduce((sum, o) => sum + o.votes, 0);
      const serialized = serializeOptions(nextOptions);

      const updated = await tx.tradingPoll.update({
        where: { id: pollId },
        data: {
          options: serialized as unknown as Prisma.InputJsonValue,
        },
      });

      const linkedMessages = await tx.chatMessage.findMany({
        where: {
          roomId: poll.roomId,
          messageType: "POLL",
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      for (const msg of linkedMessages) {
        const meta = (msg.metadata ?? {}) as Record<string, unknown>;
        if (meta.pollId !== pollId) continue;
        // Drop any accidental per-viewer votedOptionId so it cannot lock out
        // other members when the shared message metadata is remapped.
        const { votedOptionId: _drop, ...restMeta } = meta;
        void _drop;
        await tx.chatMessage.update({
          where: { id: msg.id },
          data: {
            metadata: {
              ...restMeta,
              options: serialized,
              totalVotes,
            } as Prisma.InputJsonValue,
          },
        });
        break;
      }

      return {
        poll: {
          ...updated,
          options: serialized,
          totalVotes,
        },
      };
    });

    if ("error" in result && typeof result.error === "string") {
      return jsonError(result.error, result.status);
    }

    return jsonOk({
      poll: result.poll,
      viewerId: user.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

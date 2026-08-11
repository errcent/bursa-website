import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { voteTradingPollSchema } from "@/lib/validations/api";
import type { Prisma } from "@prisma/client";

type PollOptionRecord = {
  id: string;
  label: string;
  votes: number;
};

/** Parse option definitions, dropping any legacy `voterIds` so identities never leak (QC-20260719-23). */
function asOptions(raw: unknown): PollOptionRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const opt = item as Partial<PollOptionRecord>;
    return {
      id: typeof opt.id === "string" ? opt.id : `opt-${index + 1}`,
      label: typeof opt.label === "string" ? opt.label : String(opt),
      votes: typeof opt.votes === "number" ? opt.votes : 0,
    };
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ pollId: string }> }) {
  try {
    const { pollId } = await context.params;
    const body = voteTradingPollSchema.parse(await request.json());

    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: true,
      claimedUserId: body.userId,
    });
    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

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

      // One ballot per (poll,user) enforced by the unique constraint on PollVote —
      // voter identities live in this table only, never returned to viewers (QC-20260719-23/41).
      const alreadyVoted = await tx.pollVote.findUnique({
        where: { pollId_userId: { pollId, userId: user.id } },
        select: { id: true },
      });
      if (alreadyVoted) {
        return { error: "You already voted on this poll" as const, status: 400 as const };
      }

      await tx.pollVote.create({
        data: { pollId, optionId: body.optionId, userId: user.id },
      });

      // Recount aggregates from the normalized table (never trust the cached JSON).
      const grouped = await tx.pollVote.groupBy({
        by: ["optionId"],
        where: { pollId },
        _count: { _all: true },
      });
      const countByOption = new Map(grouped.map((g) => [g.optionId, g._count._all]));
      const nextOptions = options.map((o) => ({
        ...o,
        votes: countByOption.get(o.id) ?? 0,
      }));
      const totalVotes = nextOptions.reduce((sum, o) => sum + o.votes, 0);

      const updated = await tx.tradingPoll.update({
        where: { id: pollId },
        data: { options: nextOptions as unknown as Prisma.InputJsonValue },
      });

      const linkedMessages = await tx.chatMessage.findMany({
        where: { roomId: poll.roomId, messageType: "POLL", deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      for (const msg of linkedMessages) {
        const meta = (msg.metadata ?? {}) as Record<string, unknown>;
        if (meta.pollId !== pollId) continue;
        const { votedOptionId: _drop, ...restMeta } = meta;
        void _drop;
        await tx.chatMessage.update({
          where: { id: msg.id },
          data: {
            metadata: {
              ...restMeta,
              options: nextOptions,
              totalVotes,
            } as Prisma.InputJsonValue,
          },
        });
        break;
      }

      return {
        poll: { ...updated, options: nextOptions, totalVotes },
      };
    });

    if ("error" in result && typeof result.error === "string") {
      return jsonError(result.error, result.status);
    }

    // `viewerId` lets the client mark the viewer's own choice without exposing others.
    return jsonOk({
      poll: result.poll,
      viewerId: user.id,
      votedOptionId: body.optionId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

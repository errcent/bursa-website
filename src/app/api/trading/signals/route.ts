import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { createTradingSignalSchema } from "@/lib/validations/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const roomId = searchParams.get("roomId");
    const mentorId = searchParams.get("mentorId");
    const status = searchParams.get("status");

    const signals = await db.tradingSignal.findMany({
      where: {
        ...(roomId ? { roomId } : {}),
        ...(mentorId ? { mentorId } : {}),
        ...(status
          ? { status: status as "ACTIVE" | "CLOSED" | "CANCELLED" }
          : {}),
      },
      include: {
        mentor: {
          select: { id: true, slug: true, initials: true, title: true },
        },
        room: {
          select: { id: true, name: true, slug: true, tier: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({ signals });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createTradingSignalSchema.parse(await request.json());

    const room = await db.chatRoom.findUnique({
      where: { id: body.roomId },
      select: { id: true, mentorId: true },
    });
    if (!room) {
      return jsonError("Chat room not found", 404);
    }
    if (room.mentorId && room.mentorId !== body.mentorId) {
      return jsonError("mentorId tidak cocok dengan ruang ini", 400);
    }

    let branchId: string | null = body.branchId ?? null;
    if (branchId) {
      const branch = await db.chatBranch.findFirst({
        where: { id: branchId, roomId: body.roomId, isActive: true },
        select: { id: true },
      });
      if (!branch) {
        return jsonError("Cabang tidak ditemukan di ruang ini.", 404);
      }
      branchId = branch.id;
    }

    const mentor = await db.mentorProfile.findUniqueOrThrow({
      where: { id: body.mentorId },
      select: { userId: true },
    });

    const signal = await db.tradingSignal.create({
      data: {
        roomId: body.roomId,
        mentorId: body.mentorId,
        ticker: body.ticker.trim().toUpperCase(),
        instrument: body.instrument,
        direction: body.direction,
        entryPrice: body.entryPrice,
        targetPrice: body.targetPrice,
        stopLoss: body.stopLoss,
        rationale: body.rationale?.trim() || undefined,
      },
      include: {
        mentor: {
          select: { id: true, slug: true, initials: true, title: true },
        },
        room: {
          select: { id: true, name: true, slug: true, tier: true },
        },
      },
    });

    const message = await db.chatMessage.create({
      data: {
        roomId: body.roomId,
        branchId,
        userId: mentor.userId,
        content: `Sinyal baru: ${signal.ticker} — ${signal.direction}`,
        messageType: "SIGNAL",
        metadata: {
          signalId: signal.id,
          ticker: signal.ticker,
          direction: signal.direction,
          instrument: signal.instrument,
          entryPrice: signal.entryPrice,
          targetPrice: signal.targetPrice,
          stopLoss: signal.stopLoss,
          rationale: signal.rationale ?? null,
        },
      },
      include: {
        user: {
          select: { id: true, nama: true, role: true, avatarUrl: true, bio: true },
        },
        reactions: true,
        replyTo: {
          select: {
            id: true,
            content: true,
            user: { select: { nama: true } },
          },
        },
      },
    });

    return jsonOk({ signal, message }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

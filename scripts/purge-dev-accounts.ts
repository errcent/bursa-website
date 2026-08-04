import { type Prisma, type PrismaClient } from "@prisma/client";
import { db } from "../src/lib/db";

/** Dev/seed login accounts — NOT public preview catalog mentors (@preview.bursanalar.com). */
const DEV_EMAIL_PATTERNS = [
  "@test.dev",
  "@mentor.bursa.dev",
  "@dev.bursa.dev",
  "admin@test.dev",
  "demo@bursanalar.com",
  "learner@test.dev",
  "mentor@test.dev",
  "developer@test.dev",
];

type DbClient = PrismaClient | Prisma.TransactionClient;

function assertProductionGuard() {
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    (process.env.DATABASE_URL ?? "").includes("neon.tech");

  if (isProd && process.env.CONFIRM_PRODUCTION_PURGE !== "true") {
    throw new Error("Production purge blocked. Set CONFIRM_PRODUCTION_PURGE=true deliberately.");
  }
}

/** Dev mentor seed data often includes courses, chat rooms, and ledger rows. */
async function purgeMentorProfileDependencies(client: DbClient, mentorProfileId: string) {
  const courseIds = (
    await client.course.findMany({
      where: { mentorId: mentorProfileId },
      select: { id: true },
    })
  ).map((row) => row.id);

  const slotIds = (
    await client.mentorAvailabilitySlot.findMany({
      where: { mentorId: mentorProfileId },
      select: { id: true },
    })
  ).map((row) => row.id);

  const transactionIds = (
    await client.transaction.findMany({
      where: {
        OR: [
          { mentorId: mentorProfileId },
          ...(courseIds.length > 0 ? [{ courseId: { in: courseIds } }] : []),
          ...(slotIds.length > 0 ? [{ mentorSessionId: { in: slotIds } }] : []),
        ],
      },
      select: { id: true },
    })
  ).map((row) => row.id);

  if (transactionIds.length > 0) {
    await client.commissionRecord.deleteMany({
      where: { transactionId: { in: transactionIds } },
    });
    await client.transaction.deleteMany({
      where: { id: { in: transactionIds } },
    });
  }

  await client.commissionRecord.deleteMany({
    where: { mentorId: mentorProfileId },
  });

  if (courseIds.length > 0) {
    await client.review.deleteMany({
      where: { courseId: { in: courseIds } },
    });
    await client.course.deleteMany({
      where: { id: { in: courseIds } },
    });
  }

  const roomIds = (
    await client.chatRoom.findMany({
      where: { mentorId: mentorProfileId },
      select: { id: true },
    })
  ).map((row) => row.id);

  if (roomIds.length > 0) {
    await client.tradingSignal.deleteMany({
      where: { roomId: { in: roomIds } },
    });
    await client.tradingPoll.deleteMany({
      where: { roomId: { in: roomIds } },
    });
    await client.chatRoom.deleteMany({
      where: { id: { in: roomIds } },
    });
  }

  await client.tradingSignal.deleteMany({
    where: { mentorId: mentorProfileId },
  });

  if (slotIds.length > 0) {
    await client.mentorAvailabilitySlot.deleteMany({
      where: { id: { in: slotIds } },
    });
  }
}

/** Remove rows that reference User without onDelete: Cascade (Postgres RESTRICT). */
async function purgeUserDependencies(client: DbClient, userId: string) {
  const transactionIds = (
    await client.transaction.findMany({
      where: { userId },
      select: { id: true },
    })
  ).map((row) => row.id);

  if (transactionIds.length > 0) {
    await client.commissionRecord.deleteMany({
      where: { transactionId: { in: transactionIds } },
    });
    await client.transaction.deleteMany({ where: { userId } });
  }

  await client.review.deleteMany({ where: { userId } });
  await client.chatMessage.deleteMany({ where: { userId } });
  await client.chatAuditLog.deleteMany({ where: { userId } });
  await client.adminAuditLog.deleteMany({ where: { adminId: userId } });

  await client.contentModerationQueue.updateMany({
    where: { reportedBy: userId },
    data: { reportedBy: null },
  });
  await client.contentModerationQueue.updateMany({
    where: { reviewedBy: userId },
    data: { reviewedBy: null },
  });

  await client.chatBranchChangeRequest.deleteMany({
    where: { OR: [{ mentorUserId: userId }, { reviewedById: userId }] },
  });
  await client.courseChangeRequest.deleteMany({
    where: { OR: [{ mentorUserId: userId }, { reviewedById: userId }] },
  });

  await client.mentorAvailabilitySlot.updateMany({
    where: { bookedByUserId: userId },
    data: { bookedByUserId: null, isBooked: false },
  });
  await client.mentorAvailabilitySlot.updateMany({
    where: { createdByAdminId: userId },
    data: { createdByAdminId: null },
  });

  await client.aiUsageLog.updateMany({
    where: { userId },
    data: { userId: null },
  });
}

async function main() {
  assertProductionGuard();

  const candidates = await db.user.findMany({
    where: {
      OR: DEV_EMAIL_PATTERNS.map((pattern) =>
        pattern.startsWith("@")
          ? { email: { endsWith: pattern } }
          : { email: pattern }
      ),
    },
    select: { id: true, email: true, role: true },
  });

  if (candidates.length === 0) {
    console.log(JSON.stringify({ ok: true, deleted: 0, message: "No dev accounts found." }));
    return;
  }

  const deletedEmails: string[] = [];

  for (const user of candidates) {
    await db.$transaction(async (tx) => {
      const mentorProfile = await tx.mentorProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (mentorProfile) {
        await purgeMentorProfileDependencies(tx, mentorProfile.id);
      }

      await purgeUserDependencies(tx, user.id);
      await tx.user.delete({ where: { id: user.id } });
    });
    deletedEmails.push(user.email);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        deleted: deletedEmails.length,
        emails: deletedEmails,
      },
      null,
      2
    )
  );
}

void main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

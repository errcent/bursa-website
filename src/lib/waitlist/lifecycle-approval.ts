import { db } from "@/lib/db";
import {
  isWaitlistLifecycleApprovedByEnv,
  isWaitlistLifecycleEnabled,
} from "@/lib/waitlist/config";

const CONFIG_ID = "default";

export async function isWaitlistLifecycleApproved(): Promise<boolean> {
  if (isWaitlistLifecycleApprovedByEnv()) return true;

  const config = await db.systemConfig.findUnique({
    where: { id: CONFIG_ID },
    select: { waitlistLifecycleApprovedAt: true },
  });
  return Boolean(config?.waitlistLifecycleApprovedAt);
}

export async function getWaitlistLifecycleApprovalState() {
  const config = await db.systemConfig.findUnique({
    where: { id: CONFIG_ID },
    select: {
      waitlistLifecycleApprovedAt: true,
      waitlistLifecycleApprovedByUserId: true,
      waitlistLifecycleApprovalNote: true,
    },
  });

  return {
    approvedAt: config?.waitlistLifecycleApprovedAt?.toISOString() ?? null,
    approvedByUserId: config?.waitlistLifecycleApprovedByUserId ?? null,
    note: config?.waitlistLifecycleApprovalNote ?? null,
    envApproved: isWaitlistLifecycleApprovedByEnv(),
    lifecycleEnabled: isWaitlistLifecycleEnabled(),
  };
}

export async function approveWaitlistLifecycle(input: {
  approvedByUserId: string;
  note?: string;
}) {
  return db.systemConfig.upsert({
    where: { id: CONFIG_ID },
    create: {
      id: CONFIG_ID,
      waitlistLifecycleApprovedAt: new Date(),
      waitlistLifecycleApprovedByUserId: input.approvedByUserId,
      waitlistLifecycleApprovalNote: input.note?.trim() || null,
    },
    update: {
      waitlistLifecycleApprovedAt: new Date(),
      waitlistLifecycleApprovedByUserId: input.approvedByUserId,
      waitlistLifecycleApprovalNote: input.note?.trim() || null,
    },
  });
}

export async function revokeWaitlistLifecycleApproval(revokedByUserId: string) {
  return db.systemConfig.upsert({
    where: { id: CONFIG_ID },
    create: {
      id: CONFIG_ID,
      waitlistLifecycleApprovalNote: `Revoked by ${revokedByUserId}`,
    },
    update: {
      waitlistLifecycleApprovedAt: null,
      waitlistLifecycleApprovedByUserId: null,
      waitlistLifecycleApprovalNote: `Revoked by ${revokedByUserId}`,
    },
  });
}

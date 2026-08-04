import { NextResponse } from "next/server";

import { requireAdminPanel, unauthorized } from "@/lib/admin/server";
import type { AdminWaitlistHealth } from "@/lib/admin/types";
import { db } from "@/lib/db";
import { retryFailedWaitlistSync } from "@/lib/waitlist/resend";

function csvCell(value: unknown): string {
  let text = String(value ?? "").replace(/[\r\n]+/g, " ");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  const url = new URL(request.url);
  if (url.searchParams.get("format") === "csv") {
    const entries = await db.waitlistEntry.findMany({ orderBy: { createdAt: "desc" } });
    const header = [
      "email",
      "status",
      "lifecycle_stage",
      "sync_status",
      "source",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "experience_level",
      "learning_goal",
      "market_interest",
      "created_at",
      "converted_at",
    ];
    const rows = entries.map((entry) =>
      [
        entry.email,
        entry.status,
        entry.lifecycleStage,
        entry.resendSyncStatus,
        entry.source,
        entry.utmSource,
        entry.utmMedium,
        entry.utmCampaign,
        entry.experienceLevel,
        entry.learningGoal,
        entry.marketInterest,
        entry.createdAt.toISOString(),
        entry.convertedAt?.toISOString(),
      ]
        .map(csvCell)
        .join(",")
    );
    return new NextResponse([header.map(csvCell).join(","), ...rows].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="bursa-waitlist.csv"',
      },
    });
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [statusCounts, syncFailed, pendingEnrollment, deliveryCounts, uniqueClicks, sourceCounts, contacts] =
    await Promise.all([
    db.waitlistEntry.groupBy({ by: ["status"], _count: { _all: true } }),
    db.waitlistEntry.count({ where: { resendSyncStatus: "FAILED" } }),
    db.waitlistEntry.count({
      where: { status: "ACTIVE", automationEnrolledAt: null },
    }),
    db.waitlistEmailEvent.groupBy({
      by: ["eventType"],
      where: { occurredAt: { gte: since } },
      _count: { _all: true },
    }),
    db.waitlistEmailEvent.findMany({
      where: {
        eventType: "CLICKED",
        occurredAt: { gte: since },
        providerMessageId: { not: null },
      },
      distinct: ["providerMessageId"],
      select: { id: true },
    }),
    db.waitlistEntry.groupBy({
      by: ["source"],
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
      take: 8,
    }),
    db.waitlistEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 250,
      select: {
        id: true,
        email: true,
        status: true,
        lifecycleStage: true,
        resendSyncStatus: true,
        source: true,
        utmCampaign: true,
        experienceLevel: true,
        learningGoal: true,
        marketInterest: true,
        referredByCode: true,
        createdAt: true,
      },
    }),
  ]);

  const status = Object.fromEntries(
    statusCounts.map((item) => [item.status, item._count._all])
  ) as Record<string, number>;
  const delivery = Object.fromEntries(
    deliveryCounts.map((item) => [item.eventType, item._count._all])
  ) as Record<string, number>;
  const all = Object.values(status).reduce((sum, count) => sum + count, 0);
  const sent = delivery.SENT ?? 0;
  const warning =
    all >= 1000 ? "over" : all >= 950 ? "critical" : all >= 800 ? "warning" : "ok";

  const result: AdminWaitlistHealth = {
    totals: {
      all,
      active: status.ACTIVE ?? 0,
      unsubscribed: status.UNSUBSCRIBED ?? 0,
      suppressed: status.SUPPRESSED ?? 0,
      converted: status.CONVERTED ?? 0,
      syncFailed,
      pendingEnrollment,
    },
    delivery: {
      sent,
      delivered: delivery.DELIVERED ?? 0,
      clicked: uniqueClicks.length,
      bounced: delivery.BOUNCED ?? 0,
      complained: delivery.COMPLAINED ?? 0,
      bounceRate: sent ? (delivery.BOUNCED ?? 0) / sent : 0,
      complaintRate: sent ? (delivery.COMPLAINED ?? 0) / sent : 0,
    },
    resendFreeTier: { limit: 1000, warning },
    sources: sourceCounts.map((item) => ({
      source: item.source ?? "unknown",
      count: item._count._all,
    })),
    contacts: contacts.map((entry) => ({
      id: entry.id,
      email: entry.email,
      status: entry.status,
      lifecycleStage: entry.lifecycleStage,
      syncStatus: entry.resendSyncStatus,
      source: entry.source,
      utmCampaign: entry.utmCampaign,
      experienceLevel: entry.experienceLevel,
      learningGoal: entry.learningGoal,
      marketInterest: entry.marketInterest,
      referred: Boolean(entry.referredByCode),
      createdAt: entry.createdAt.toISOString(),
    })),
  };

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  const result = await retryFailedWaitlistSync();
  return NextResponse.json({ ok: true, ...result });
}


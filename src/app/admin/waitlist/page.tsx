"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Download, MailCheck, RefreshCw, ShieldAlert, Users } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { StatCard } from "@/components/admin/stat-card";
import { useAdminToast } from "@/components/admin/admin-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  downloadWaitlistCsv,
  fetchWaitlistHealth,
  retryWaitlistSync,
} from "@/lib/admin/api";
import type { AdminWaitlistContact, AdminWaitlistHealth } from "@/lib/admin/types";

const percent = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "percent", maximumFractionDigits: 2 }).format(value);

export default function AdminWaitlistPage() {
  const { toast } = useAdminToast();
  const [health, setHealth] = useState<AdminWaitlistHealth | null>(null);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchWaitlistHealth();
    setHealth(result.data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchWaitlistHealth().then((result) => {
      if (!cancelled) setHealth(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function retrySync() {
    setRetrying(true);
    try {
      const result = await retryWaitlistSync();
      toast(`${result.data.synced} kontak berhasil disinkronkan.`);
      await load();
    } catch {
      toast("Retry sinkronisasi gagal.", "error");
    } finally {
      setRetrying(false);
    }
  }

  const columns: DataTableColumn<AdminWaitlistContact>[] = [
    {
      key: "email",
      header: "Kontak",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium">{row.email}</p>
          <p className="text-xs text-muted-foreground">
            {row.source ?? "unknown"}
            {row.utmCampaign ? ` · ${row.utmCampaign}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <Badge variant={row.status === "ACTIVE" ? "accent" : "secondary"}>
          {row.status.toLowerCase()}
        </Badge>
      ),
    },
    {
      key: "lifecycleStage",
      header: "Lifecycle",
      sortable: true,
      render: (row) => row.lifecycleStage.toLowerCase(),
    },
    {
      key: "syncStatus",
      header: "Resend",
      sortable: true,
      render: (row) => (
        <span className={row.syncStatus === "FAILED" ? "text-destructive" : ""}>
          {row.syncStatus.toLowerCase()}
        </span>
      ),
    },
    {
      key: "experienceLevel",
      header: "Segment",
      render: (row) =>
        [row.experienceLevel, row.marketInterest, row.referred ? "referral" : null]
          .filter(Boolean)
          .join(" · ") || "—",
    },
    {
      key: "createdAt",
      header: "Daftar",
      sortable: true,
      render: (row) => new Date(row.createdAt).toLocaleDateString("id-ID"),
    },
  ];

  if (!health) return <Skeleton className="h-[32rem] rounded-xl" />;

  const tierWarning = health.resendFreeTier.warning;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Waitlist Health</h1>
          <p className="text-sm text-muted-foreground">
            Consent, segment, lifecycle, conversion, dan deliverability 30 hari terakhir.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void downloadWaitlistCsv()}>
            <Download /> Export CSV
          </Button>
          <Button onClick={retrySync} disabled={retrying}>
            <RefreshCw className={retrying ? "animate-spin" : ""} />
            Retry sync
          </Button>
        </div>
      </div>

      {tierWarning !== "ok" ? (
        <div
          className={`rounded-xl border p-4 text-sm ${
            tierWarning === "warning"
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          }`}
        >
          Resend Free: {health.totals.all}/{health.resendFreeTier.limit} kontak.{" "}
          {tierWarning === "warning"
            ? "Siapkan rencana upgrade sebelum 950 kontak."
            : "Hentikan akuisisi baru atau upgrade sebelum automation terganggu."}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Kontak aktif"
          value={health.totals.active}
          hint={`${health.totals.all} total`}
          icon={Users}
        />
        <StatCard
          label="Delivered"
          value={health.delivery.delivered}
          hint={`${health.delivery.clicked} unique click events`}
          icon={MailCheck}
        />
        <StatCard
          label="Bounce"
          value={percent(health.delivery.bounceRate)}
          hint={`${health.delivery.bounced} event`}
          icon={Activity}
        />
        <StatCard
          label="Complaint"
          value={percent(health.delivery.complaintRate)}
          hint="Target Gmail <0,1%; stop sebelum 0,3%"
          icon={ShieldAlert}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="surface-card p-5">
          <h2 className="font-heading font-semibold">Sumber utama</h2>
          <div className="mt-4 space-y-3">
            {health.sources.map((source) => (
              <div key={source.source} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{source.source}</span>
                <span className="font-medium tabular-nums">{source.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="surface-card grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Converted</p>
            <p className="mt-1 text-xl font-semibold">{health.totals.converted}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Unsubscribed</p>
            <p className="mt-1 text-xl font-semibold">{health.totals.unsubscribed}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Suppressed</p>
            <p className="mt-1 text-xl font-semibold">{health.totals.suppressed}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sync failed</p>
            <p className="mt-1 text-xl font-semibold">{health.totals.syncFailed}</p>
          </div>
        </div>
      </div>

      <DataTable
        data={health.contacts}
        columns={columns}
        getRowId={(row) => row.id}
        searchKeys={["email", "source", "utmCampaign", "experienceLevel", "marketInterest"]}
        searchPlaceholder="Cari email, source, campaign, atau segment..."
        pageSize={12}
      />
    </div>
  );
}


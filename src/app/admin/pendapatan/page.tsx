"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  DollarSign,
  TrendingUp,
  UserSquare2,
  Wallet,
} from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { StatCard } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchRevenueReport } from "@/lib/admin/api";
import type {
  AdminRevenueByCourse,
  AdminRevenueByMentor,
  AdminRevenueLine,
  AdminRevenueReport,
} from "@/lib/admin/types";
import { formatRupiah } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type PeriodFilter = "all" | "30d" | "90d";

const statusLabel: Record<AdminRevenueLine["status"], string> = {
  COMPLETED: "Selesai",
  PENDING: "Menunggu",
  FAILED: "Gagal",
  REFUNDED: "Refund",
  ESTIMATED: "Estimasi",
};

function inPeriod(iso: string, period: PeriodFilter) {
  if (period === "all") return true;
  const days = period === "30d" ? 30 : 90;
  return Date.now() - new Date(iso).getTime() <= days * 24 * 60 * 60 * 1000;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPendapatanPage() {
  const [report, setReport] = useState<AdminRevenueReport | null>(null);
  const [source, setSource] = useState<"api" | "mock">("api");
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("all");

  useEffect(() => {
    fetchRevenueReport()
      .then((res) => {
        setReport(res.data);
        setSource(res.source);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredLines = useMemo(() => {
    if (!report) return [];
    return report.lines.filter((line) => inPeriod(line.createdAt, period));
  }, [report, period]);

  const filteredTotals = useMemo(() => {
    return filteredLines.reduce(
      (acc, line) => {
        acc.transactionCount += 1;
        acc.gross += line.coursePrice;
        acc.platformFee += line.platformFee;
        acc.mentorPayout += line.mentorPayout;
        return acc;
      },
      { transactionCount: 0, gross: 0, platformFee: 0, mentorPayout: 0 }
    );
  }, [filteredLines]);

  const filteredByMentor = useMemo(() => {
    const map = new Map<string, AdminRevenueByMentor>();
    for (const line of filteredLines) {
      const row = map.get(line.mentorId) ?? {
        mentorId: line.mentorId,
        mentorName: line.mentorName,
        transactionCount: 0,
        gross: 0,
        platformFee: 0,
        mentorPayout: 0,
      };
      row.transactionCount += 1;
      row.gross += line.coursePrice;
      row.platformFee += line.platformFee;
      row.mentorPayout += line.mentorPayout;
      map.set(line.mentorId, row);
    }
    return [...map.values()].sort((a, b) => b.platformFee - a.platformFee);
  }, [filteredLines]);

  const filteredByCourse = useMemo(() => {
    const map = new Map<string, AdminRevenueByCourse>();
    for (const line of filteredLines) {
      const row = map.get(line.courseId) ?? {
        courseId: line.courseId,
        courseTitle: line.courseTitle,
        mentorName: line.mentorName,
        transactionCount: 0,
        gross: 0,
        platformFee: 0,
        mentorPayout: 0,
      };
      row.transactionCount += 1;
      row.gross += line.coursePrice;
      row.platformFee += line.platformFee;
      row.mentorPayout += line.mentorPayout;
      map.set(line.courseId, row);
    }
    return [...map.values()].sort((a, b) => b.platformFee - a.platformFee);
  }, [filteredLines]);

  const lineColumns: DataTableColumn<AdminRevenueLine>[] = [
    {
      key: "createdAt",
      header: "Tanggal",
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap text-sm">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: "courseTitle",
      header: "Kelas",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium">{row.courseTitle}</p>
          <p className="text-xs text-muted-foreground">{row.mentorName}</p>
        </div>
      ),
    },
    {
      key: "buyerName",
      header: "Pembeli",
      sortable: true,
      render: (row) =>
        row.buyerName ? (
          <div>
            <p className="font-medium">{row.buyerName}</p>
            <p className="text-xs text-muted-foreground">{row.buyerEmail}</p>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "coursePrice",
      header: "Harga",
      sortable: true,
      render: (row) => formatRupiah(row.coursePrice),
    },
    {
      key: "platformFee",
      header: "Komisi platform",
      sortable: true,
      render: (row) => (
        <span className="text-emerald">{formatRupiah(row.platformFee)}</span>
      ),
    },
    {
      key: "mentorPayout",
      header: "Bagian mentor",
      sortable: true,
      render: (row) => formatRupiah(row.mentorPayout),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          variant={
            row.status === "COMPLETED"
              ? "accent"
              : row.status === "ESTIMATED"
                ? "secondary"
                : row.status === "FAILED" || row.status === "REFUNDED"
                  ? "destructive"
                  : "outline"
          }
        >
          {statusLabel[row.status]}
        </Badge>
      ),
    },
  ];

  const mentorColumns: DataTableColumn<AdminRevenueByMentor>[] = [
    {
      key: "mentorName",
      header: "Mentor",
      sortable: true,
      render: (row) => row.mentorName,
    },
    {
      key: "transactionCount",
      header: "Transaksi",
      sortable: true,
      render: (row) => row.transactionCount,
    },
    {
      key: "gross",
      header: "Gross",
      sortable: true,
      render: (row) => formatRupiah(row.gross),
    },
    {
      key: "platformFee",
      header: "Komisi platform",
      sortable: true,
      render: (row) => (
        <span className="text-emerald">{formatRupiah(row.platformFee)}</span>
      ),
    },
    {
      key: "mentorPayout",
      header: "Bagian mentor",
      sortable: true,
      render: (row) => formatRupiah(row.mentorPayout),
    },
  ];

  const courseColumns: DataTableColumn<AdminRevenueByCourse>[] = [
    {
      key: "courseTitle",
      header: "Kelas",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium">{row.courseTitle}</p>
          <p className="text-xs text-muted-foreground">{row.mentorName}</p>
        </div>
      ),
    },
    {
      key: "transactionCount",
      header: "Transaksi",
      sortable: true,
      render: (row) => row.transactionCount,
    },
    {
      key: "gross",
      header: "Gross",
      sortable: true,
      render: (row) => formatRupiah(row.gross),
    },
    {
      key: "platformFee",
      header: "Komisi platform",
      sortable: true,
      render: (row) => (
        <span className="text-emerald">{formatRupiah(row.platformFee)}</span>
      ),
    },
    {
      key: "mentorPayout",
      header: "Bagian mentor",
      sortable: true,
      render: (row) => formatRupiah(row.mentorPayout),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!report) return null;

  const periodButtons: { id: PeriodFilter; label: string }[] = [
    { id: "all", label: "Semua" },
    { id: "30d", label: "30 hari" },
    { id: "90d", label: "90 hari" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Pendapatan</h1>
          <p className="text-sm text-muted-foreground">
            Rincian asal usul pendapatan platform (komisi{" "}
            {report.commissionRatePercent}% dari harga kelas).
            {source === "mock" && (
              <span className="ml-2 text-amber">(mode demo — API tidak tersedia)</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-background p-1">
          {periodButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setPeriod(btn.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                period === btn.id
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber/20 bg-amber/5 px-4 py-3 text-sm text-foreground">
        {report.note}
        {period !== "all" && (
          <span className="ml-1 text-muted-foreground">
            Filter periode diterapkan pada ringkasan dan tabel di bawah.
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pendapatan platform"
          value={formatRupiah(filteredTotals.platformFee)}
          icon={DollarSign}
          hint={`Komisi ${report.commissionRatePercent}%`}
        />
        <StatCard
          label="Gross penjualan"
          value={formatRupiah(filteredTotals.gross)}
          icon={TrendingUp}
          hint="Total harga kelas terjual"
        />
        <StatCard
          label="Bagian mentor"
          value={formatRupiah(filteredTotals.mentorPayout)}
          icon={Wallet}
          hint={`${100 - report.commissionRatePercent}% ke mentor`}
        />
        <StatCard
          label="Transaksi"
          value={filteredTotals.transactionCount}
          icon={BookOpen}
          hint={
            report.dataSource === "transaction"
              ? "Transaksi selesai"
              : "Estimasi dari enrollment"
          }
        />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-sm font-semibold">Rincian transaksi</h2>
          <p className="text-xs text-muted-foreground">
            Setiap baris menelusuri mentor, kelas, harga, komisi, pembeli, dan tanggal.
          </p>
        </div>
        <DataTable
          data={filteredLines}
          columns={lineColumns}
          getRowId={(row) => row.id}
          searchKeys={["courseTitle", "mentorName", "buyerName", "buyerEmail"]}
          searchPlaceholder="Cari kelas, mentor, atau pembeli..."
          pageSize={10}
          emptyMessage="Belum ada transaksi pendapatan."
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <UserSquare2 className="size-4 text-muted-foreground" />
            <h2 className="font-heading text-sm font-semibold">Agregasi per mentor</h2>
          </div>
          <DataTable
            data={filteredByMentor}
            columns={mentorColumns}
            getRowId={(row) => row.mentorId}
            searchKeys={["mentorName"]}
            searchPlaceholder="Cari mentor..."
            pageSize={6}
            emptyMessage="Belum ada agregasi mentor."
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-muted-foreground" />
            <h2 className="font-heading text-sm font-semibold">Agregasi per kelas</h2>
          </div>
          <DataTable
            data={filteredByCourse}
            columns={courseColumns}
            getRowId={(row) => row.courseId}
            searchKeys={["courseTitle", "mentorName"]}
            searchPlaceholder="Cari kelas..."
            pageSize={6}
            emptyMessage="Belum ada agregasi kelas."
          />
        </section>
      </div>
    </div>
  );
}

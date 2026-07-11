"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  DollarSign,
  MessageSquare,
  ShieldAlert,
  UserSquare2,
  Users,
} from "lucide-react";

import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchStats } from "@/lib/admin/api";
import type { AdminStats } from "@/lib/admin/types";
import { formatRupiah } from "@/lib/mock-data";
import { PLATFORM_COMMISSION_RATE } from "@/lib/pricing";

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [source, setSource] = useState<"api" | "mock">("api");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then((res) => {
        setStats(res.data);
        setSource(res.source);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan operasional platform Bursa.
            {source === "mock" && (
              <span className="ml-2 text-amber">(mode demo — API tidak tersedia)</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" render={<Link href="/admin/courses" />}>
            <BookOpen className="size-4" />
            Tambah Kelas
          </Button>
          <Button size="sm" variant="outline" render={<Link href="/admin/mentors" />}>
            <UserSquare2 className="size-4" />
            Tambah Mentor
          </Button>
          <Button size="sm" variant="outline" render={<Link href="/admin/chat-rooms" />}>
            <MessageSquare className="size-4" />
            Buat Chat Room
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Pengguna" value={stats.totalUsers} icon={Users} hint="Semua akun terdaftar" />
        <StatCard label="Mentor" value={stats.totalMentors} icon={UserSquare2} hint="Profil mentor aktif" />
        <StatCard label="Kelas" value={stats.totalCourses} icon={BookOpen} hint="Kursus di katalog" />
        <StatCard
          label="Pendaftaran"
          value={stats.totalEnrollments}
          icon={Users}
          hint="Total enrollment"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Link
          href="/admin/pendapatan"
          className="block rounded-xl transition-opacity hover:opacity-90 lg:col-span-1"
        >
          <StatCard
            label="Pendapatan platform"
            value={formatRupiah(stats.revenue)}
            icon={DollarSign}
            hint={`Komisi ${Math.round(PLATFORM_COMMISSION_RATE * 100)}% — klik untuk rincian`}
          />
        </Link>
        <StatCard
          label="Chat Room Aktif"
          value={stats.activeChatRooms}
          icon={MessageSquare}
          className="lg:col-span-1"
        />
        <StatCard
          label="Moderasi Tertunda"
          value={stats.pendingModeration}
          icon={ShieldAlert}
          hint="Perlu ditinjau segera"
          className="lg:col-span-1"
        />
      </div>

      <section className="surface-card p-5">
        <h2 className="mb-4 font-heading text-sm font-semibold">Aktivitas Terbaru</h2>
        <ul className="space-y-3">
          {stats.recentActivity.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-sm">{item.description}</p>
                {item.actor && (
                  <p className="text-xs text-muted-foreground">{item.actor}</p>
                )}
              </div>
              <time className="shrink-0 text-xs text-muted-foreground">
                {formatRelativeTime(item.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

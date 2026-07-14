"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Loader2, Receipt, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchMentorCourses } from "@/lib/mentor/api";
import {
  fetchMentorDashboardProfile,
  fetchMentorTransactions,
} from "@/lib/instruktur-dashboard/api";
import { formatRupiah } from "@/lib/mock-data";

export default function InstrukturDashboardHomePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof fetchMentorDashboardProfile>> | null>(null);
  const [courseCount, setCourseCount] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [monthlyNet, setMonthlyNet] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const monthKey = new Date().toISOString().slice(0, 7);

    void Promise.all([
      fetchMentorDashboardProfile(),
      fetchMentorCourses(),
      fetchMentorTransactions(1, 100),
    ])
      .then(([prof, courses, tx]) => {
        if (cancelled) return;
        setProfile(prof);
        setCourseCount(courses.length);
        setTransactionCount(tx.total);
        const net = tx.items
          .filter(
            (item) =>
              item.createdAt.startsWith(monthKey) &&
              item.payoutStatus !== "REFUNDED" &&
              item.transactionStatus !== "REFUNDED"
          )
          .reduce((sum, item) => sum + item.netMentorAmount, 0);
        setMonthlyNet(net);
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const hasCourses = courseCount > 0;
  const hasTransactions = transactionCount > 0;

  const kpis = useMemo(
    () => [
      {
        label: "Total siswa",
        value: profile ? profile.studentsCount.toLocaleString("id-ID") : "—",
      },
      {
        label: "Rating rata-rata",
        value: profile ? profile.rating.toFixed(1) : "—",
      },
      {
        label: "Pendapatan bulan ini (net)",
        value: formatRupiah(monthlyNet),
      },
    ],
    [profile, monthlyNet]
  );

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Beranda</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan performa, course, dan pendapatan mentor Anda.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="surface-card p-5">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">{kpi.value}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <Button
          className="h-auto flex-col items-start gap-2 p-4"
          variant="outline"
          render={<Link href="/instruktur-dashboard/course" />}
        >
          <BookOpen className="size-4" />
          <span className="text-left">
            <span className="block font-medium">Edit Course</span>
            <span className="block text-xs font-normal text-muted-foreground">Atur harga & detail</span>
          </span>
        </Button>
        <Button
          className="h-auto flex-col items-start gap-2 p-4"
          variant="outline"
          render={<Link href="/instruktur-dashboard/transaksi" />}
        >
          <Receipt className="size-4" />
          <span className="text-left">
            <span className="block font-medium">Lihat Transaksi</span>
            <span className="block text-xs font-normal text-muted-foreground">Komisi & payout</span>
          </span>
        </Button>
        <Button
          className="h-auto flex-col items-start gap-2 p-4"
          variant="outline"
          render={<Link href="/instruktur-dashboard/profil" />}
        >
          <UserRound className="size-4" />
          <span className="text-left">
            <span className="block font-medium">Perbarui Profil</span>
            <span className="block text-xs font-normal text-muted-foreground">Bio & sosial</span>
          </span>
        </Button>
      </section>

      {!hasCourses && (
        <div className="surface-card flex flex-col items-center gap-4 p-8 text-center">
          <p className="font-heading text-sm font-medium">Belum ada course</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Mulai dengan mengedit atau membuat course pertama melalui tab Course.
          </p>
          <Button render={<Link href="/instruktur-dashboard/course" />}>Buka Course Saya</Button>
        </div>
      )}

      {!hasTransactions && hasCourses && (
        <div className="surface-card flex flex-col items-center gap-3 p-8 text-center">
          <p className="font-heading text-sm font-medium">Belum ada transaksi</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Transaksi akan muncul setelah siswa menyelesaikan checkout kelas Anda.
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, ClipboardList, Loader2, MessageSquare, UserRound } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { canMutateMentor } from "@/lib/auth/roles";
import { KOMUNITAS_ENABLED } from "@/lib/features/komunitas";
import { fetchMentorDashboardProfile } from "@/lib/instruktur-dashboard/api";
import { fetchMentorChangeRequests, fetchMentorCourses } from "@/lib/mentor/api";

export default function MentorDashboardPage() {
  const { session } = useAuth();
  const readOnly = !canMutateMentor(session?.role);
  const [loading, setLoading] = useState(true);
  const [courseCount, setCourseCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [studentsCount, setStudentsCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void Promise.all([
      fetchMentorCourses(),
      fetchMentorChangeRequests("PENDING"),
      fetchMentorDashboardProfile().catch(() => null),
    ])
      .then(([courses, requests, profile]) => {
        if (cancelled) return;
        setCourseCount(courses.length);
        setPendingRequests(requests.length);
        setStudentsCount(profile?.studentsCount ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setCourseCount(0);
          setPendingRequests(0);
          setStudentsCount(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Ringkasan Mentor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajukan usulan perubahan konten kelas, kelola course & transaksi, dan perbarui profil publik.
          {readOnly && " Anda sedang meninjau sebagai developer (QC)."}
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-32 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="surface-card p-5">
            <p className="text-xs text-muted-foreground">Kelas aktif</p>
            <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">{courseCount}</p>
          </div>
          <div className="surface-card p-5">
            <p className="text-xs text-muted-foreground">Usulan menunggu review</p>
            <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">{pendingRequests}</p>
          </div>
          <div className="surface-card p-5">
            <p className="text-xs text-muted-foreground">Total siswa</p>
            <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
              {studentsCount !== null ? studentsCount.toLocaleString("id-ID") : "—"}
            </p>
          </div>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Button
          className="h-auto flex-col items-start gap-2 p-4"
          variant="outline"
          render={<Link href="/instruktur-dashboard" />}
        >
          <BookOpen className="size-4" />
          <span className="text-left">
            <span className="block font-medium">Dashboard Instruktur</span>
            <span className="block text-xs font-normal text-muted-foreground">
              Course, transaksi, profil
            </span>
          </span>
        </Button>
        <Button
          className="h-auto flex-col items-start gap-2 p-4"
          variant="outline"
          render={<Link href="/mentor/usulan" />}
        >
          <ClipboardList className="size-4" />
          <span className="text-left">
            <span className="block font-medium">Usulan Konten</span>
            <span className="block text-xs font-normal text-muted-foreground">
              Ajukan perubahan kurikulum
            </span>
          </span>
        </Button>
        {KOMUNITAS_ENABLED && (
          <Button
            className="h-auto flex-col items-start gap-2 p-4"
            variant="outline"
            render={<Link href="/mentor/chat" />}
          >
            <MessageSquare className="size-4" />
            <span className="text-left">
              <span className="block font-medium">Group Chat</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Kolaborasi admin & domain
              </span>
            </span>
          </Button>
        )}
        <Button
          className="h-auto flex-col items-start gap-2 p-4"
          variant="outline"
          render={<Link href="/instruktur-dashboard/profil" />}
        >
          <UserRound className="size-4" />
          <span className="text-left">
            <span className="block font-medium">Profil Publik</span>
            <span className="block text-xs font-normal text-muted-foreground">
              Bio, tagline, sosial
            </span>
          </span>
        </Button>
      </section>

      <section className="surface-card p-5">
        <h2 className="mb-2 font-heading text-sm font-semibold">Alur konten</h2>
        <p className="text-sm text-muted-foreground">
          Perubahan konten kelas hanya diterapkan setelah admin menyetujui usulan Anda di{" "}
          <Link href="/mentor/usulan" className="link-accent">
            Usulan Konten
          </Link>
          . Edit harga, metadata, dan profil publik lewat{" "}
          <Link href="/instruktur-dashboard" className="link-accent">
            Dashboard Instruktur
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

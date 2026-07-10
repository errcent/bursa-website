"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { buildLoginHref } from "@/lib/auth/redirect";

export function SettingsAccount() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-20 animate-pulse rounded-2xl bg-muted" />;
  }

  if (!session) {
    return (
      <section className="surface-card p-5">
        <h2 className="section-title text-base">Akun</h2>
        <p className="section-copy mt-2">
          Masuk atau buat akun untuk menyimpan progres belajar dan mengakses dashboard.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" render={<Link href={buildLoginHref("/pengaturan")} />}>
            Masuk
          </Button>
          <Button size="sm" className="btn-primary" render={<Link href="/daftar" />}>
            Daftar
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="section-title">Akun</h2>
      <p className="section-copy mt-1">
        Informasi login dan keamanan akunmu.
      </p>

      <div className="surface-card mt-6 space-y-4 p-5">
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex flex-col gap-1 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-mono text-xs sm:text-right">{session.email}</dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <dt className="text-muted-foreground">Kata sandi</dt>
            <dd className="flex flex-wrap items-center gap-3 sm:justify-end">
              <span className="font-mono text-xs tracking-widest text-muted-foreground">
                ••••••••
              </span>
              <Button size="sm" variant="outline" disabled className="opacity-60">
                Ubah kata sandi
              </Button>
            </dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Perubahan email dan kata sandi akan tersedia segera. Edit profil publik di halaman profil.
        </p>
        <Button size="sm" variant="outline" render={<Link href="/profil" />}>
          Edit profil
        </Button>
      </div>
    </section>
  );
}

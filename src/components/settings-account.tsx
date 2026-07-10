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
    <section className="surface-card p-5">
      <h2 className="section-title text-base">Akun</h2>
      <dl className="mt-4 flex flex-col gap-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-border/60 pb-3">
          <dt className="text-muted-foreground">Nama</dt>
          <dd className="text-right font-heading font-medium">{session.name}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border/60 pb-3">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="text-right font-mono text-xs">{session.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Peran</dt>
          <dd className="text-right text-sm capitalize">{session.role}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">
        Edit foto, nama pengguna, dan bio di bagian Profil di atas. Email tidak dapat diubah di sini.
      </p>
      <Button size="sm" variant="outline" className="mt-4" render={<Link href="/pengaturan#profil" />}>
        Edit profil
      </Button>
    </section>
  );
}

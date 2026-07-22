import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Pengaturan Platform</h1>
        <p className="text-sm text-muted-foreground">
          Konfigurasi global dan dokumentasi operasional admin.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="surface-card space-y-3 p-5">
          <h2 className="font-heading text-sm font-semibold">Operasional</h2>
          <p className="text-sm text-muted-foreground">
            Komisi platform saat ini diterapkan otomatis di checkout dan laporan pendapatan.
          </p>
          <Button size="sm" variant="outline" render={<Link href="/admin/pendapatan" />}>
            Lihat laporan pendapatan
          </Button>
        </section>

        <section className="surface-card space-y-3 p-5">
          <h2 className="font-heading text-sm font-semibold">Dokumen publik</h2>
          <p className="text-sm text-muted-foreground">
            Sinkronkan dan publikasikan kebijakan privasi, syarat, dan halaman kepercayaan.
          </p>
          <Button size="sm" variant="outline" render={<Link href="/admin/dokumen-publik" />}>
            Kelola dokumen publik
          </Button>
        </section>

        <section className="surface-card space-y-3 p-5 sm:col-span-2">
          <h2 className="font-heading text-sm font-semibold">Roadmap modul</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Maintenance mode & feature flags terpusat</li>
            <li>Batas ruang chat per mentor (saat komunitas aktif)</li>
            <li>Preferensi proteksi konten default per tier</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

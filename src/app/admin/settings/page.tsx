export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Pengaturan Platform</h1>
        <p className="text-sm text-muted-foreground">
          Konfigurasi global platform akan tersedia di sini.
        </p>
      </div>
      <div className="rounded-xl border border-white/8 bg-[#161a24] p-6 text-sm text-muted-foreground">
        <p>Maintenance mode, batas chat room per mentor, dan preferensi proteksi konten dapat dikelola dari modul ini pada iterasi berikutnya.</p>
      </div>
    </div>
  );
}

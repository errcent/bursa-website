import { MentorTransactionList } from "@/components/instruktur-dashboard/mentor-transaction-list";

export const metadata = {
  title: "Transaksi & Komisi — Dashboard Instruktur",
};

export default function InstrukturDashboardTransaksiPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Transaksi & Komisi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Riwayat penjualan dengan breakdown komisi platform 25% dan estimasi net mentor.
        </p>
      </div>
      <MentorTransactionList />
    </div>
  );
}

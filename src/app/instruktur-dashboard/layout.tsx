import { InstrukturDashboardShell } from "@/components/instruktur-dashboard/instruktur-dashboard-shell";

export const metadata = {
  title: "Dashboard Instruktur",
};

export default function InstrukturDashboardLayout({ children }: { children: React.ReactNode }) {
  return <InstrukturDashboardShell>{children}</InstrukturDashboardShell>;
}

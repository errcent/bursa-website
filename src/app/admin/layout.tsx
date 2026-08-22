import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { requireServerSession } from "@/lib/auth/server-page-guard";

export const metadata = {
  title: "Admin Panel",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireServerSession(["ADMIN", "DEVELOPER"], "/admin");
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}

"use client";

import { usePathname } from "next/navigation";

import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminToastProvider } from "@/components/admin/admin-toast";
import { QcBanner } from "@/components/qc-banner";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);

  return (
    <AdminGuard>
      <AdminToastProvider>
        <div className="flex min-h-screen flex-col bg-background text-foreground">
          <QcBanner panelLabel="Admin Panel" />
          <div className="flex min-h-0 flex-1">
            <AdminSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <AdminHeader segments={segments} />
              <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
            </div>
          </div>
        </div>
      </AdminToastProvider>
    </AdminGuard>
  );
}

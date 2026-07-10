"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { isQcViewer } from "@/lib/auth/roles";

export function QcBanner({ panelLabel }: { panelLabel: string }) {
  const { session } = useAuth();
  if (!isQcViewer(session?.role)) return null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-200 sm:text-sm">
      <span className="inline-flex items-center justify-center gap-2">
        <Eye className="size-3.5 shrink-0" />
        Mode QC Developer — meninjau {panelLabel} (hanya lihat). Chat internal mentor tetap
        terkunci.{" "}
        <Link href="/developer" className="font-medium underline underline-offset-2">
          Kembali ke QC
        </Link>
      </span>
    </div>
  );
}

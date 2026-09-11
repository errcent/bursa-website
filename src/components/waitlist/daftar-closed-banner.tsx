"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DAFTAR_CLOSED_EXPLAINER } from "@/lib/features/auth-surface-copy";

export function DaftarClosedBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("from") !== "daftar") return null;

  return (
    <div
      className="mb-6 w-full rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-left"
      role="status"
    >
      <p className="text-sm font-medium">{DAFTAR_CLOSED_EXPLAINER.headline}</p>
      <p className="mt-1 text-sm text-muted-foreground">{DAFTAR_CLOSED_EXPLAINER.sub}</p>
      <Button
        size="sm"
        variant="outline"
        className="mt-3"
        render={<Link href="/katalog">{DAFTAR_CLOSED_EXPLAINER.secondaryCta}</Link>}
      />
    </div>
  );
}

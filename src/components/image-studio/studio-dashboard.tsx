"use client";

import { useCallback, useEffect, useState } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { FluxSyncPanel } from "@/components/image-studio/flux-sync-panel";
import { GenerateForm } from "@/components/image-studio/generate-form";
import { ProviderCards } from "@/components/image-studio/provider-cards";
import { UsageLogTable } from "@/components/image-studio/usage-log-table";
import { Card, CardContent } from "@/components/ui/card";
import type {
  FluxPoolSnapshot,
  LedgerEntry,
  ProviderStatus,
  UsageSummary,
} from "@/lib/image-studio/types";

type UsageItem = LedgerEntry & { imageUrl: string | null };

export function StudioDashboard() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [fluxPool, setFluxPool] = useState<FluxPoolSnapshot | null>(null);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [usage, setUsage] = useState<UsageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    const [statusRes, usageRes] = await Promise.all([
      fetch("/api/studio/status", { cache: "no-store" }),
      fetch("/api/studio/usage?limit=100", { cache: "no-store" }),
    ]);

    if (statusRes.ok) {
      const statusData = (await statusRes.json()) as {
        providers: ProviderStatus[];
        fluxPool: FluxPoolSnapshot;
        summary: UsageSummary;
      };
      setProviders(statusData.providers);
      setFluxPool(statusData.fluxPool);
      setSummary(statusData.summary);
    }

    if (usageRes.ok) {
      const usageData = (await usageRes.json()) as { items: UsageItem[] };
      setUsage(usageData.items);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await loadAll();
      setLoading(false);
    })();
  }, [loadAll]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Memuat Image Studio…
      </div>
    );
  }

  const freeRemaining = fluxPool?.freeGenerationsRemaining ?? 0;
  const freeGranted = fluxPool?.freeGenerationsGranted ?? 20;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-3 border-b border-border/60 pb-6">
        <BrandLogo variant="product" slot="productAdmin" decorative className="h-6" />
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Image Studio
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Meter kapasitas $0 - lacak pool gratis BFL MCP, generate via FLUX.2 atau Pollinations,
          dan riwayat pemakaian dengan spesifikasi lengkap.
        </p>
      </header>

      <Card className="border-emerald/20 bg-emerald/5">
        <CardContent className="grid gap-4 py-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Sisa gratis BFL</p>
            <p className="font-heading text-2xl font-semibold text-emerald">
              {freeRemaining}
              <span className="text-base font-normal text-muted-foreground"> / {freeGranted}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sudah dipakai (gratis)</p>
            <p className="font-heading text-2xl font-semibold">
              {summary?.freeGenerated ?? 0}
              <span className="text-base font-normal text-muted-foreground"> gambar</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total kredit tercatat</p>
            <p className="font-heading text-2xl font-semibold">
              {summary?.totalCreditsUsed ?? 0}
              <span className="text-base font-normal text-muted-foreground"> credits</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <ProviderCards providers={providers} onRefresh={handleRefresh} refreshing={refreshing} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <GenerateForm providers={providers} onGenerated={loadAll} />
        <FluxSyncPanel onSynced={loadAll} />
      </div>

      <UsageLogTable items={usage} />
    </div>
  );
}

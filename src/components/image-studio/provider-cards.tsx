"use client";

import { RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProviderStatus } from "@/lib/image-studio/types";

type ProviderCardsProps = {
  providers: ProviderStatus[];
  onRefresh: () => void;
  refreshing: boolean;
};

export function ProviderCards({ providers, onRefresh, refreshing }: ProviderCardsProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Kapasitas Gratis</h2>
          <p className="text-sm text-muted-foreground">Pool BFL MCP + Pollinations ($0)</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={refreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {providers.map((provider) => (
          <Card key={provider.id} size="sm">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{provider.name}</CardTitle>
                <Badge variant={provider.configured ? "default" : "secondary"}>
                  {provider.configured ? "Ready" : "No key"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{provider.freeTierNote}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {provider.id === "bfl" ? (
                <>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Pool gratis</span>
                    <span className="font-medium text-emerald">
                      {provider.freeGenerationsRemaining ?? 0}
                      {provider.freeGenerationsGranted
                        ? ` / ${provider.freeGenerationsGranted}`
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Dipakai (ledger)</span>
                    <span>{provider.stats.freeGenerated} gambar</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Est. sisa gratis</span>
                    <span className="font-medium text-emerald">
                      ~{provider.estimatedRemainingImages ?? 0} gambar
                    </span>
                  </div>
                  {(provider.credits.paidCredits ?? 0) > 0 ? (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Paid credits</span>
                      <span>{provider.credits.paidCredits?.toFixed(1)}</span>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-emerald">Gratis</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Rate limit</span>
                    <span>~1 req / 15 detik</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Dipakai (ledger)</span>
                    <span>{provider.stats.totalGenerated} gambar</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Est. sisa</span>
                    <span className="text-muted-foreground">Tidak terbatas*</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FluxSyncPanelProps = {
  onSynced: () => void;
};

export function FluxSyncPanel({ onSynced }: FluxSyncPanelProps) {
  const [json, setJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    if (!json.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const payload = JSON.parse(json);
      const res = await fetch("/api/studio/sync/flux-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        error?: string;
        fluxPool?: { freeGenerationsRemaining: number; freeGenerationsGranted: number };
        imported?: number;
      };
      if (!res.ok) throw new Error(data.error ?? "Sync gagal");

      setMessage(
        `Pool: ${data.fluxPool?.freeGenerationsRemaining ?? "?"}/${data.fluxPool?.freeGenerationsGranted ?? "?"} gratis` +
          (data.imported ? ` · ${data.imported} riwayat diimpor` : "")
      );
      onSynced();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="size-4" />
          Sync dari FLUX MCP
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Paste output <code className="rounded bg-muted px-1">get_credits</code> dari MCP FLUX di
          Cursor. Format:{" "}
          <code className="rounded bg-muted px-1">
            {`{"free_generations":18,"free_generations_total_granted":20,"credits":0}`}
          </code>
        </p>
        <textarea
          className="min-h-24 w-full rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-xs outline-none focus:border-accent/40"
          value={json}
          onChange={(event) => setJson(event.target.value)}
          placeholder='{"data":{"free_generations":18,"free_generations_total_granted":20,"credits":0}}'
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {message ? <p className="text-xs text-emerald">{message}</p> : null}
        <Button variant="outline" size="sm" onClick={handleSync} disabled={loading || !json.trim()}>
          {loading ? <Loader2 className="animate-spin" /> : <Upload />}
          Sync pool
        </Button>
      </CardContent>
    </Card>
  );
}

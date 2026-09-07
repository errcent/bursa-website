"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ASPECT_PRESETS, PROMPT_PRESETS } from "@/lib/image-studio/presets";
import type {
  ImageQuality,
  PromptPresetId,
  ProviderStatus,
  StudioProviderId,
} from "@/lib/image-studio/types";

type GenerateFormProps = {
  providers: ProviderStatus[];
  onGenerated: () => void;
};

const fieldClass =
  "w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent/40 focus:ring-2 focus:ring-accent/20";

export function GenerateForm({ providers, onGenerated }: GenerateFormProps) {
  const bfl = providers.find((p) => p.id === "bfl");
  const defaultProvider: StudioProviderId =
    (bfl?.freeGenerationsRemaining ?? 0) > 0 && bfl?.configured ? "bfl" : "pollinations";

  const [providerId, setProviderId] = useState<StudioProviderId>(defaultProvider);
  const provider = providers.find((item) => item.id === providerId) ?? providers[0];
  const models = provider?.models ?? [];

  const [modelId, setModelId] = useState(models[0]?.id ?? "");
  const [prompt, setPrompt] = useState("");
  const [preset, setPreset] = useState<PromptPresetId>("portrait");
  const [aspectId, setAspectId] = useState<(typeof ASPECT_PRESETS)[number]["id"]>("16:9");
  const [seed, setSeed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspect = useMemo(
    () => ASPECT_PRESETS.find((item) => item.id === aspectId) ?? ASPECT_PRESETS[0],
    [aspectId]
  );

  const usesFreePool = providerId === "bfl" && (bfl?.freeGenerationsRemaining ?? 0) > 0;
  const bflPoolEmpty = providerId === "bfl" && (bfl?.freeGenerationsRemaining ?? 0) <= 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || !modelId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerId,
          model: modelId,
          prompt: prompt.trim(),
          width: aspect.width,
          height: aspect.height,
          seed: seed ? Number(seed) : undefined,
          preset,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Generate gagal");

      onGenerated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="size-4 text-accent" />
          Generate
          {usesFreePool ? (
            <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-xs font-normal text-emerald">
              Pool gratis BFL
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bflPoolEmpty ? (
          <p className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            Pool gratis BFL habis - pakai Pollinations atau sync MCP untuk update saldo.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Provider</span>
              <select
                className={fieldClass}
                value={providerId}
                onChange={(event) => {
                  const next = event.target.value as StudioProviderId;
                  setProviderId(next);
                  const nextProvider = providers.find((item) => item.id === next);
                  setModelId(nextProvider?.models[0]?.id ?? "");
                }}
              >
                {providers.map((item) => (
                  <option key={item.id} value={item.id} disabled={!item.configured}>
                    {item.name}
                    {!item.configured ? " (no key)" : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Model</span>
              <select
                className={fieldClass}
                value={modelId}
                onChange={(event) => setModelId(event.target.value)}
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="text-muted-foreground">Preset</span>
            <select
              className={fieldClass}
              value={preset}
              onChange={(event) => setPreset(event.target.value as PromptPresetId)}
            >
              {PROMPT_PRESETS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="text-muted-foreground">Prompt</span>
            <textarea
              className={`${fieldClass} min-h-28 resize-y`}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Deskripsikan gambar yang ingin dibuat…"
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Aspect</span>
              <select
                className={fieldClass}
                value={aspectId}
                onChange={(event) =>
                  setAspectId(event.target.value as (typeof ASPECT_PRESETS)[number]["id"])
                }
              >
                {ASPECT_PRESETS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label} ({item.width}×{item.height})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Seed (opsional)</span>
              <input
                className={fieldClass}
                type="number"
                value={seed}
                onChange={(event) => setSeed(event.target.value)}
                placeholder="Random"
              />
            </label>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={loading || !provider?.configured}>
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? "Generating…" : "Generate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

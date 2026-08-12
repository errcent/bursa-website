"use client";

import { useState } from "react";
import { Copy, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LedgerEntry } from "@/lib/image-studio/types";

type HistoryItem = LedgerEntry & { imageUrl: string | null };

type HistoryGridProps = {
  items: HistoryItem[];
  onRegenerate: (item: HistoryItem) => void;
};

export function HistoryGrid({ items, onRegenerate }: HistoryGridProps) {
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  async function copyPrompt(text: string) {
    await navigator.clipboard.writeText(text);
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Belum ada generate. Hasil akan muncul di sini.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Riwayat</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card
              key={item.id}
              size="sm"
              className="cursor-pointer overflow-hidden"
              onClick={() => item.status === "success" && setSelected(item)}
            >
              <div className="aspect-video bg-muted/30">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.prompt}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-4 text-center text-xs text-destructive">
                    {item.error ?? "Gagal"}
                  </div>
                )}
              </div>
              <CardContent className="space-y-2 pt-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{item.provider}</Badge>
                  <Badge variant="outline">{item.model}</Badge>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{item.prompt}</p>
                <p className="text-[11px] text-muted-foreground/80">
                  ${item.costEstimate.toFixed(3)} · {new Date(item.createdAt).toLocaleString("id-ID")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-auto">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <CardTitle className="text-base">Preview</CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setSelected(null)}>
                <X />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {selected.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.imageUrl}
                  alt={selected.prompt}
                  className="w-full rounded-lg border border-border"
                />
              ) : null}
              <p className="text-sm text-muted-foreground">{selected.prompt}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => copyPrompt(selected.prompt)}>
                  <Copy />
                  Copy prompt
                </Button>
                <Button variant="outline" size="sm" onClick={() => onRegenerate(selected)}>
                  <RotateCcw />
                  Re-generate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}

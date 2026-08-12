"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LedgerEntry } from "@/lib/image-studio/types";

type UsageItem = LedgerEntry & { imageUrl: string | null };

type UsageLogTableProps = {
  items: UsageItem[];
};

type Filter = "all" | "free" | "bfl" | "pollinations";

export function UsageLogTable({ items }: UsageLogTableProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filter === "free") return item.billingMode === "free";
      if (filter === "bfl") return item.provider === "bfl";
      if (filter === "pollinations") return item.provider === "pollinations";
      return true;
    });
  }, [items, filter]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Semua" },
    { id: "free", label: "Gratis" },
    { id: "bfl", label: "BFL" },
    { id: "pollinations", label: "Pollinations" },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Riwayat Pemakaian</h2>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                filter === item.id
                  ? "border-accent/40 bg-accent/15 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {filtered.length} entri
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-4">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Tanggal</th>
                <th className="pb-2 pr-3 font-medium">Provider</th>
                <th className="pb-2 pr-3 font-medium">Model</th>
                <th className="pb-2 pr-3 font-medium">Ukuran</th>
                <th className="pb-2 pr-3 font-medium">MP</th>
                <th className="pb-2 pr-3 font-medium">Kredit</th>
                <th className="pb-2 pr-3 font-medium">Billing</th>
                <th className="pb-2 pr-3 font-medium">Sumber</th>
                <th className="pb-2 pr-3 font-medium">Prompt</th>
                <th className="pb-2 font-medium">Thumb</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-muted-foreground">
                    Belum ada riwayat.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-b border-border/30 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("id-ID", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-2 pr-3">{item.provider}</td>
                    <td className="py-2 pr-3">{item.model}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {item.width}×{item.height}
                    </td>
                    <td className="py-2 pr-3">{item.megapixels?.toFixed(2) ?? "-"}</td>
                    <td className="py-2 pr-3">{item.creditsUsed ?? 0}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={item.isFree ? "default" : "outline"}>
                        {item.isFree ? "Gratis" : "Paid"}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">{item.source}</td>
                    <td className="max-w-[220px] py-2 pr-3">
                      <p className="line-clamp-2 text-muted-foreground">{item.prompt}</p>
                      {item.note ? (
                        <p className="mt-0.5 text-[10px] text-muted-foreground/70">{item.note}</p>
                      ) : null}
                    </td>
                    <td className="py-2">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="size-12 rounded border border-border object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}

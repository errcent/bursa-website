"use client";

import { calculateCheckoutBreakdown } from "@/lib/pricing";
import { formatRupiah } from "@/lib/mock-data";

export function CommissionPreview({ price }: { price: number }) {
  const safePrice = Number.isFinite(price) && price > 0 ? Math.round(price) : 0;
  const breakdown = calculateCheckoutBreakdown(safePrice);

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Pratinjau komisi</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Harga jual</span>
          <span className="font-mono tabular-nums">{formatRupiah(breakdown.coursePrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Komisi platform ({breakdown.commissionRatePercent}%)
          </span>
          <span className="font-mono tabular-nums text-amber-200">
            {formatRupiah(breakdown.platformFee)}
          </span>
        </div>
        <div className="flex justify-between border-t border-border pt-1.5 font-medium">
          <span>Estimasi terima</span>
          <span className="font-mono tabular-nums text-emerald">
            {formatRupiah(breakdown.mentorPayout)}
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { LabField, LabNumberInput, LabResultTile } from "@/components/lab/lab-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calculateDcfFairValue,
  calculatePeRelativeFairValue,
  evaluateAgainstPrice,
} from "@/lib/lab/fair-value";
import { cn } from "@/lib/utils";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 2,
});

function VerdictBanner({ marginOfSafetyPct, verdict }: { marginOfSafetyPct: number; verdict: "undervalued" | "overvalued" | "fair" }) {
  const copy = {
    undervalued: "Harga saat ini di bawah estimasi fair value (potensial undervalued).",
    overvalued: "Harga saat ini di atas estimasi fair value (potensial overvalued).",
    fair: "Harga saat ini mendekati estimasi fair value.",
  }[verdict];

  return (
    <div
      className={cn(
        "rounded-xl border p-3 text-sm",
        verdict === "undervalued" && "border-profit/30 bg-profit/5 text-profit",
        verdict === "overvalued" && "border-loss/30 bg-loss/5 text-loss",
        verdict === "fair" && "border-border bg-muted text-muted-foreground"
      )}
    >
      <span className="font-medium">
        Margin of safety: {marginOfSafetyPct >= 0 ? "+" : ""}
        {marginOfSafetyPct.toFixed(1)}%
      </span>
      <span className="ml-1.5">{copy}</span>
    </div>
  );
}

function DcfTab() {
  const [eps, setEps] = useState("850");
  const [growthRate, setGrowthRate] = useState("10");
  const [discountRate, setDiscountRate] = useState("12");
  const [years, setYears] = useState("5");
  const [terminalGrowth, setTerminalGrowth] = useState("3");
  const [currentPrice, setCurrentPrice] = useState("");

  const result = calculateDcfFairValue({
    eps: Number(eps) || 0,
    growthRatePct: Number(growthRate) || 0,
    discountRatePct: Number(discountRate) || 0,
    years: Math.max(1, Math.floor(Number(years) || 0)),
    terminalGrowthPct: Number(terminalGrowth) || 0,
  });

  const priceNum = Number(currentPrice) || 0;
  const evaluation = result.valid && priceNum > 0 ? evaluateAgainstPrice(result.fairValue, priceNum) : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="EPS (laba per lembar, TTM)" id="dcf-eps" suffix="Rp">
          <LabNumberInput id="dcf-eps" value={eps} onChange={setEps} min={0} />
        </LabField>
        <LabField label="Pertumbuhan EPS (growth)" id="dcf-growth" suffix="%/th">
          <LabNumberInput id="dcf-growth" value={growthRate} onChange={setGrowthRate} />
        </LabField>
        <LabField label="Discount rate" id="dcf-discount" suffix="%/th" helperText="Umumnya 10–15% untuk saham">
          <LabNumberInput id="dcf-discount" value={discountRate} onChange={setDiscountRate} />
        </LabField>
        <LabField label="Horizon proyeksi" id="dcf-years" suffix="tahun">
          <LabNumberInput id="dcf-years" value={years} onChange={setYears} min={1} max={20} step={1} />
        </LabField>
        <LabField
          label="Pertumbuhan jangka panjang (terminal)"
          id="dcf-terminal"
          suffix="%/th"
          helperText="Harus lebih kecil dari discount rate"
        >
          <LabNumberInput id="dcf-terminal" value={terminalGrowth} onChange={setTerminalGrowth} />
        </LabField>
        <LabField label="Harga saat ini (opsional)" id="dcf-price" suffix="Rp">
          <LabNumberInput id="dcf-price" value={currentPrice} onChange={setCurrentPrice} min={0} placeholder="Untuk bandingkan" />
        </LabField>
      </div>

      {result.valid ? (
        <>
          <LabResultTile label="Estimasi fair value per lembar" value={rupiah.format(result.fairValue)} tone="positive" />
          {evaluation && <VerdictBanner {...evaluation} />}
        </>
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Discount rate harus lebih besar dari terminal growth rate, dan EPS harus lebih besar dari
            0, agar hasil valid.
          </span>
        </div>
      )}
    </div>
  );
}

function PeTab() {
  const [eps, setEps] = useState("850");
  const [comparablePe, setComparablePe] = useState("15");
  const [currentPrice, setCurrentPrice] = useState("");

  const epsNum = Number(eps) || 0;
  const peNum = Number(comparablePe) || 0;
  const fairValue = calculatePeRelativeFairValue(epsNum, peNum);
  const priceNum = Number(currentPrice) || 0;
  const evaluation = fairValue > 0 && priceNum > 0 ? evaluateAgainstPrice(fairValue, priceNum) : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="EPS (laba per lembar, TTM)" id="pe-eps" suffix="Rp">
          <LabNumberInput id="pe-eps" value={eps} onChange={setEps} min={0} />
        </LabField>
        <LabField label="P/E pembanding" id="pe-ratio" helperText="P/E rata-rata industri atau perusahaan sejenis">
          <LabNumberInput id="pe-ratio" value={comparablePe} onChange={setComparablePe} min={0} />
        </LabField>
        <LabField label="Harga saat ini (opsional)" id="pe-price" suffix="Rp">
          <LabNumberInput id="pe-price" value={currentPrice} onChange={setCurrentPrice} min={0} placeholder="Untuk bandingkan" />
        </LabField>
      </div>

      <LabResultTile label="Estimasi fair value per lembar" value={rupiah.format(fairValue)} tone="positive" />
      {evaluation && <VerdictBanner {...evaluation} />}
    </div>
  );
}

export function FairValueCalculator() {
  return (
    <div className="surface-card p-5 sm:p-6">
      <Tabs defaultValue="dcf">
        <TabsList className="mb-5 w-full sm:w-auto">
          <TabsTrigger value="dcf">DCF (pertumbuhan EPS)</TabsTrigger>
          <TabsTrigger value="pe">P/E pembanding</TabsTrigger>
        </TabsList>
        <TabsContent value="dcf">
          <DcfTab />
        </TabsContent>
        <TabsContent value="pe">
          <PeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

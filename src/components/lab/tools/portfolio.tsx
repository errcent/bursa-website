"use client";

import { useMemo, useState } from "react";

import { LabField, LabNumberInput, LabResultTile } from "@/components/lab/lab-field";
import { valueAtRisk } from "@/lib/lab/portfolio";

function fmt(n: number, d = 2): string {
  return n.toLocaleString("id-ID", { maximumFractionDigits: d });
}

export function PortfolioVarCalculator() {
  const [value, setValue] = useState("1000000000");
  const [vol, setVol] = useState("25");
  const [confidence, setConfidence] = useState("95");

  const result = useMemo(() => valueAtRisk({
    portfolioValue: parseFloat(value) || 0,
    volatility: parseFloat(vol) || 0,
    confidenceLevel: parseFloat(confidence) || 95,
  }), [value, vol, confidence]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <LabField label="Nilai portofolio" id="var-val" suffix="Rp"><LabNumberInput id="var-val" value={value} onChange={setValue} min={0} /></LabField>
        <LabField label="Volatilitas tahunan" id="var-vol" suffix="%"><LabNumberInput id="var-vol" value={vol} onChange={setVol} min={0} /></LabField>
        <LabField label="Confidence level" id="var-cl" suffix="%"><LabNumberInput id="var-cl" value={confidence} onChange={setConfidence} min={0} max={100} /></LabField>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <LabResultTile label="VaR (1 hari)" value={`Rp ${fmt(result.var, 0)}`} tone="negative" />
        <LabResultTile label="VaR %" value={`${fmt(result.varPercent)}%`} tone="negative" />
      </div>
    </div>
  );
}

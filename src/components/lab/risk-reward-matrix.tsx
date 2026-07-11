"use client";

import { useMemo, useState } from "react";

import { LabField, LabNumberInput, LabResultTile } from "@/components/lab/lab-field";
import { cn } from "@/lib/utils";

const WIN_RATES = [20, 30, 40, 50, 60, 70, 80, 90];
const RR_RATIOS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5];

function expectancy(winRatePct: number, rr: number) {
  const w = winRatePct / 100;
  return w * rr - (1 - w) * 1;
}

function cellTone(value: number): "positive" | "negative" | "neutral" {
  if (value > 0.05) return "positive";
  if (value < -0.05) return "negative";
  return "neutral";
}

function nearestIndex(options: number[], target: number) {
  let bestIdx = 0;
  let bestDiff = Infinity;
  options.forEach((opt, idx) => {
    const diff = Math.abs(opt - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = idx;
    }
  });
  return bestIdx;
}

export function RiskRewardMatrix() {
  const [winRate, setWinRate] = useState("45");
  const [riskReward, setRiskReward] = useState("2");

  const winRateNum = Math.min(100, Math.max(0, Number(winRate) || 0));
  const rrNum = Math.max(0, Number(riskReward) || 0);
  const yourExpectancy = expectancy(winRateNum, rrNum);
  const tone = cellTone(yourExpectancy);

  const highlightRowIdx = useMemo(() => nearestIndex(WIN_RATES, winRateNum), [winRateNum]);
  const highlightColIdx = useMemo(() => nearestIndex(RR_RATIOS, rrNum), [rrNum]);

  return (
    <div className="flex flex-col gap-6">
      <div className="surface-card p-5 sm:p-6">
        <h3 className="mb-4 font-heading text-base font-semibold">Cek strategi kamu</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <LabField label="Win rate kamu" id="rr-winrate" suffix="%">
            <LabNumberInput id="rr-winrate" value={winRate} onChange={setWinRate} min={0} max={100} />
          </LabField>
          <LabField label="Risk : reward kamu" id="rr-ratio" suffix="R">
            <LabNumberInput id="rr-ratio" value={riskReward} onChange={setRiskReward} min={0} />
          </LabField>
        </div>

        <LabResultTile
          className="mt-4"
          label="Expectancy per trade"
          value={`${yourExpectancy >= 0 ? "+" : ""}${yourExpectancy.toFixed(2)} R`}
          tone={tone === "neutral" ? "neutral" : tone}
        />
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {tone === "positive" &&
            "Secara matematis, kombinasi ini positif — rata-rata setiap trade menghasilkan lebih dari yang dirisikokan, dalam jangka panjang."}
          {tone === "negative" &&
            "Secara matematis, kombinasi ini negatif — dalam jangka panjang, kombinasi win rate dan R:R ini cenderung merugi."}
          {tone === "neutral" &&
            "Kombinasi ini mendekati titik impas (break-even) — belum jelas untung atau rugi secara matematis."}
        </p>
      </div>

      <div className="surface-card overflow-x-auto p-5 sm:p-6">
        <h3 className="mb-1 font-heading text-base font-semibold">Matriks expectancy (dalam R)</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Baris = win rate, kolom = rasio risk:reward. Sel yang ditandai lingkaran biru adalah titik
          terdekat dengan input kamu di atas.
        </p>

        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card p-2 text-left font-mono text-xs font-medium text-muted-foreground">
                Win rate ＼ R:R
              </th>
              {RR_RATIOS.map((rr, colIdx) => (
                <th
                  key={rr}
                  className={cn(
                    "p-2 text-center font-mono text-xs font-medium text-muted-foreground",
                    colIdx === highlightColIdx && "text-accent"
                  )}
                >
                  {rr}R
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WIN_RATES.map((wr, rowIdx) => (
              <tr key={wr}>
                <th
                  className={cn(
                    "sticky left-0 z-10 bg-card p-2 text-left font-mono text-xs font-medium text-muted-foreground",
                    rowIdx === highlightRowIdx && "text-accent"
                  )}
                >
                  {wr}%
                </th>
                {RR_RATIOS.map((rr, colIdx) => {
                  const value = expectancy(wr, rr);
                  const cellToneValue = cellTone(value);
                  const isHighlighted = rowIdx === highlightRowIdx && colIdx === highlightColIdx;
                  return (
                    <td key={rr} className="p-1">
                      <div
                        className={cn(
                          "flex h-11 items-center justify-center rounded-lg border font-mono text-xs font-medium",
                          cellToneValue === "positive" && "border-profit/25 bg-profit/10 text-profit",
                          cellToneValue === "negative" && "border-loss/25 bg-loss/10 text-loss",
                          cellToneValue === "neutral" &&
                            "border-border bg-muted text-muted-foreground",
                          isHighlighted && "ring-2 ring-accent"
                        )}
                      >
                        {value >= 0 ? "+" : ""}
                        {value.toFixed(2)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

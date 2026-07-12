"use client";

import { useMemo, useState } from "react";

import { LabField, LabNumberInput, LabResultTile } from "@/components/lab/lab-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tradeExpectancy } from "@/lib/lab/performance";
import { cn } from "@/lib/utils";

const WIN_RATES = [20, 30, 40, 50, 60, 70, 80, 90];
const RR_RATIOS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5];

function fmt(n: number, d = 2): string {
  return n.toLocaleString("id-ID", { maximumFractionDigits: d });
}

function expectancy(winRatePct: number, rr: number) {
  const w = winRatePct / 100;
  return w * rr - (1 - w);
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

export function TradeExpectancyCalculator() {
  const [winRate, setWinRate] = useState("55");
  const [rr, setRr] = useState("2");
  const [risk, setRisk] = useState("1000000");
  const [trades, setTrades] = useState("100");

  const winRateNum = Math.min(100, Math.max(0, Number(winRate) || 0));
  const rrNum = Math.max(0, Number(rr) || 0);

  const result = useMemo(() => {
    const wr = parseFloat(winRate);
    const r = parseFloat(rr);
    const rk = parseFloat(risk);
    const t = parseInt(trades);
    if (!wr || !r || !rk || !t) return null;
    return tradeExpectancy({ winRate: wr, riskRewardRatio: r, riskPerTrade: rk, numTrades: t });
  }, [winRate, rr, risk, trades]);

  const yourExpectancy = expectancy(winRateNum, rrNum);
  const tone = cellTone(yourExpectancy);
  const highlightRowIdx = useMemo(() => nearestIndex(WIN_RATES, winRateNum), [winRateNum]);
  const highlightColIdx = useMemo(() => nearestIndex(RR_RATIOS, rrNum), [rrNum]);

  return (
    <Tabs defaultValue="calculator">
      <TabsList className="mb-4">
        <TabsTrigger value="calculator">Kalkulator</TabsTrigger>
        <TabsTrigger value="matrix">Matriks Win Rate × R:R</TabsTrigger>
      </TabsList>

      <TabsContent value="calculator">
        <div className="surface-card p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <LabField label="Win rate" id="te-wr" suffix="%">
              <LabNumberInput id="te-wr" value={winRate} onChange={setWinRate} min={0} max={100} />
            </LabField>
            <LabField label="R:R ratio" id="te-rr">
              <LabNumberInput id="te-rr" value={rr} onChange={setRr} min={0} />
            </LabField>
            <LabField label="Risiko per trade" id="te-risk" suffix="Rp">
              <LabNumberInput id="te-risk" value={risk} onChange={setRisk} min={0} />
            </LabField>
            <LabField label="Jumlah trade" id="te-trades">
              <LabNumberInput id="te-trades" value={trades} onChange={setTrades} min={1} />
            </LabField>
          </div>
          {result && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <LabResultTile label="Expectancy (R)" value={fmt(result.expectancyR)} tone={result.expectancyR > 0 ? "positive" : "negative"} />
              <LabResultTile label="Expectancy (Rp)" value={`Rp ${fmt(result.expectancyNominal, 0)}`} />
              <LabResultTile label="Total expected" value={`Rp ${fmt(result.totalExpected, 0)}`} tone={result.totalExpected > 0 ? "positive" : "negative"} />
              <LabResultTile label="Profit factor" value={fmt(result.profitFactor)} />
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="matrix">
        <div className="flex flex-col gap-6">
          <div className="surface-card p-5 sm:p-6">
            <h3 className="mb-4 font-heading text-base font-semibold">Cek strategi kamu</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <LabField label="Win rate kamu" id="mx-winrate" suffix="%">
                <LabNumberInput id="mx-winrate" value={winRate} onChange={setWinRate} min={0} max={100} />
              </LabField>
              <LabField label="Risk : reward kamu" id="mx-ratio" suffix="R">
                <LabNumberInput id="mx-ratio" value={rr} onChange={setRr} min={0} />
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
                  {RR_RATIOS.map((ratio, colIdx) => (
                    <th
                      key={ratio}
                      className={cn(
                        "p-2 text-center font-mono text-xs font-medium text-muted-foreground",
                        colIdx === highlightColIdx && "text-accent"
                      )}
                    >
                      {ratio}R
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
                    {RR_RATIOS.map((ratio, colIdx) => {
                      const value = expectancy(wr, ratio);
                      const cellToneValue = cellTone(value);
                      const isHighlighted = rowIdx === highlightRowIdx && colIdx === highlightColIdx;
                      return (
                        <td key={ratio} className="p-1">
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
      </TabsContent>
    </Tabs>
  );
}

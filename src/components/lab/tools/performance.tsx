"use client";

import { useMemo, useState } from "react";

import { LabCalculatorShell, LabOutputPanel } from "@/components/lab/lab-calculator-shell";
import {
  LabCopyResults,
  LabField,
  LabInterpretation,
  LabNumberInput,
  LabResultGrid,
  LabResultTile,
  LabToolPanel,
} from "@/components/lab/lab-field";
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
  const matrixTone = cellTone(yourExpectancy);
  const highlightRowIdx = useMemo(() => nearestIndex(WIN_RATES, winRateNum), [winRateNum]);
  const highlightColIdx = useMemo(() => nearestIndex(RR_RATIOS, rrNum), [rrNum]);

  const copyText = result
    ? [
        "Trade Expectancy",
        `Expectancy: ${fmt(result.expectancyR)}R (Rp ${fmt(result.expectancyNominal, 0)}/trade)`,
        `Matriks posisi: ${yourExpectancy >= 0 ? "+" : ""}${yourExpectancy.toFixed(2)} R`,
        `Total ${trades} trade: Rp ${fmt(result.totalExpected, 0)}`,
        `Profit factor: ${fmt(result.profitFactor)}`,
      ].join("\n")
    : "";

  return (
    <div className="flex flex-col gap-8">
      <LabCalculatorShell
        input={
          <LabToolPanel description="Win rate dan R:R dipakai bersama kalkulator & matriks.">
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
          </LabToolPanel>
        }
        output={
          <LabOutputPanel footer={<LabCopyResults text={copyText} />}>
            {!result ? (
              <LabInterpretation>Isi parameter strategi.</LabInterpretation>
            ) : (
              <div className="flex flex-col gap-4">
                <LabResultTile
                  label="Posisi di matriks"
                  value={`${yourExpectancy >= 0 ? "+" : ""}${yourExpectancy.toFixed(2)} R`}
                  tone={matrixTone === "neutral" ? "neutral" : matrixTone}
                />
                <LabInterpretation tone={result.expectancyR > 0 ? "positive" : "negative"}>
                  {result.expectancyR > 0
                    ? "Edge positif — rata-rata setiap trade menghasilkan lebih dari risiko (belum termasuk biaya)."
                    : "Edge negatif — strategi cenderung merugi secara matematis dengan asumsi ini."}
                </LabInterpretation>
                <LabResultGrid className="mt-0 grid-cols-1 gap-2">
                  <LabResultTile label="Expectancy (R)" value={fmt(result.expectancyR)} tone={result.expectancyR > 0 ? "positive" : "negative"} />
                  <LabResultTile label="Expectancy (Rp)" value={`Rp ${fmt(result.expectancyNominal, 0)}`} />
                  <LabResultTile label={`Total (${trades} trade)`} value={`Rp ${fmt(result.totalExpected, 0)}`} tone={result.totalExpected > 0 ? "positive" : "negative"} />
                  <LabResultTile label="Profit factor" value={fmt(result.profitFactor)} />
                </LabResultGrid>
              </div>
            )}
          </LabOutputPanel>
        }
      />

      <LabToolPanel description="Baris = win rate, kolom = R:R. Sel terhighlight = input kamu.">
        <div className="mb-4 md:hidden">
          <LabResultTile
            label={`Sel kamu (${winRateNum}% × ${rrNum}R)`}
            value={`${yourExpectancy >= 0 ? "+" : ""}${yourExpectancy.toFixed(2)} R`}
            tone={matrixTone === "neutral" ? "neutral" : matrixTone}
          />
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Geser ke layar lebih lebar untuk matriks penuh, atau putar perangkat ke landscape.
          </p>
        </div>
        <div className="hidden overflow-x-auto md:block">
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
                            cellToneValue === "neutral" && "border-border bg-muted text-muted-foreground",
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
      </LabToolPanel>
    </div>
  );
}

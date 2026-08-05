"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { LabCalculatorShell, LabOutputPanel } from "@/components/lab/lab-calculator-shell";
import {
  LabCopyResults,
  LabField,
  LabInterpretation,
  LabNumberInput,
  LabPresetBar,
  LabResultGrid,
  LabResultTile,
  LabToolPanel,
} from "@/components/lab/lab-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_SIMULATIONS = 3000;
const MAX_TRADES = 400;
const AUTO_RUN_CAP = 200;
const HISTOGRAM_BINS = 16;
const DEBOUNCE_MS = 800;

type SimulationResult = {
  endings: number[];
  p10: number;
  p50: number;
  p90: number;
  mean: number;
  worst: number;
  best: number;
  startingCapital: number;
  profitableShare: number;
  ruinShare: number;
  bins: { from: number; to: number; count: number; label: string }[];
  equityCurve: { trade: number; equity: number }[];
  maxDrawdown: number;
};

function percentile(sorted: number[], p: number): number {
  const idx = Math.floor(sorted.length * p);
  return sorted[Math.min(sorted.length - 1, Math.max(0, idx))];
}

function generateEquityPath(params: {
  startingCapital: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  numTrades: number;
}): { trade: number; equity: number }[] {
  const { startingCapital, winRate, avgWin, avgLoss, numTrades } = params;
  const curve: { trade: number; equity: number }[] = [{ trade: 0, equity: startingCapital }];
  let balance = startingCapital;
  for (let t = 1; t <= numTrades; t++) {
    const isWin = Math.random() * 100 < winRate;
    balance *= isWin ? 1 + avgWin / 100 : 1 - avgLoss / 100;
    if (balance <= 0) balance = 0;
    curve.push({ trade: t, equity: balance });
    if (balance <= 0) break;
  }
  return curve;
}

function runSimulation(params: {
  startingCapital: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  numSimulations: number;
  numTrades: number;
}): SimulationResult {
  const { startingCapital, winRate, avgWin, avgLoss, numSimulations, numTrades } = params;
  const endings: number[] = new Array(numSimulations);
  let ruinCount = 0;

  for (let s = 0; s < numSimulations; s++) {
    let balance = startingCapital;
    for (let t = 0; t < numTrades; t++) {
      const isWin = Math.random() * 100 < winRate;
      balance *= isWin ? 1 + avgWin / 100 : 1 - avgLoss / 100;
      if (balance <= 0) {
        balance = 0;
        break;
      }
    }
    endings[s] = balance;
    if (balance <= startingCapital * 0.01) ruinCount++;
  }

  const sorted = [...endings].sort((a, b) => a - b);
  const mean = endings.reduce((sum, v) => sum + v, 0) / endings.length;
  const worst = sorted[0];
  const best = sorted[sorted.length - 1];
  const profitableShare = endings.filter((v) => v > startingCapital).length / endings.length;
  const ruinShare = ruinCount / endings.length;

  const min = worst;
  const max = best;
  const range = Math.max(max - min, 1e-9);
  const binSize = range / HISTOGRAM_BINS;
  const bins = Array.from({ length: HISTOGRAM_BINS }, (_, i) => {
    const from = min + i * binSize;
    const to = min + (i + 1) * binSize;
    return {
      from,
      to,
      count: 0,
      label: formatCompact(from),
    };
  });
  for (const value of endings) {
    const idx = Math.min(HISTOGRAM_BINS - 1, Math.floor((value - min) / binSize));
    bins[Math.max(0, idx)].count += 1;
  }

  const equityCurve = generateEquityPath({ startingCapital, winRate, avgWin, avgLoss, numTrades });
  let peak = startingCapital;
  let maxDrawdown = 0;
  for (const point of equityCurve) {
    if (point.equity > peak) peak = point.equity;
    const dd = peak > 0 ? ((peak - point.equity) / peak) * 100 : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  return {
    endings,
    p10: percentile(sorted, 0.1),
    p50: percentile(sorted, 0.5),
    p90: percentile(sorted, 0.9),
    mean,
    worst,
    best,
    startingCapital,
    profitableShare,
    ruinShare,
    bins,
    equityCurve,
    maxDrawdown,
  };
}

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(Math.round(value));
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function EquityCurveChart({
  curve,
  startingCapital,
}: {
  curve: { trade: number; equity: number }[];
  startingCapital: number;
}) {
  const width = 600;
  const height = 140;
  const padding = { top: 8, right: 8, bottom: 24, left: 8 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const equities = curve.map((c) => c.equity);
  const minEq = Math.min(...equities, startingCapital * 0.9);
  const maxEq = Math.max(...equities, startingCapital * 1.1);
  const range = Math.max(maxEq - minEq, 1);

  const points = curve
    .map((c, i) => {
      const x = padding.left + (i / Math.max(curve.length - 1, 1)) * chartW;
      const y = padding.top + chartH - ((c.equity - minEq) / range) * chartH;
      return `${x},${y}`;
    })
    .join(" ");

  const startY = padding.top + chartH - ((startingCapital - minEq) / range) * chartH;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full rounded-lg border border-border/40 bg-muted/10"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Contoh equity curve satu simulasi"
    >
      <line
        x1={padding.left}
        y1={startY}
        x2={width - padding.right}
        y2={startY}
        stroke="currentColor"
        strokeOpacity={0.25}
        strokeDasharray="4 4"
        className="text-accent"
      />
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        points={points}
        className={curve[curve.length - 1].equity >= startingCapital ? "text-profit" : "text-loss"}
      />
      <text x={padding.left} y={height - 4} className="fill-muted-foreground text-[10px]">
        Trade 0
      </text>
      <text x={width - padding.right - 40} y={height - 4} className="fill-muted-foreground text-[10px]">
        Trade {curve[curve.length - 1]?.trade ?? 0}
      </text>
    </svg>
  );
}

export function MonteCarloSimulator() {
  const [startingCapital, setStartingCapital] = useState("10000000");
  const [winRate, setWinRate] = useState("45");
  const [avgWin, setAvgWin] = useState("3");
  const [avgLoss, setAvgLoss] = useState("1.5");
  const [numSimulations, setNumSimulations] = useState("500");
  const [numTrades, setNumTrades] = useState("100");
  const [activePreset, setActivePreset] = useState<string>();
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const lastRunKeyRef = useRef<string>("");

  const parsed = useMemo(() => ({
    startingCapital: Math.max(0, Number(startingCapital) || 0),
    winRate: Math.min(100, Math.max(0, Number(winRate) || 0)),
    avgWin: Math.max(0, Number(avgWin) || 0),
    avgLoss: Math.max(0, Number(avgLoss) || 0),
    numSimulations: Math.min(MAX_SIMULATIONS, Math.max(10, Math.floor(Number(numSimulations) || 0))),
    numTrades: Math.min(MAX_TRADES, Math.max(1, Math.floor(Number(numTrades) || 0))),
  }), [startingCapital, winRate, avgWin, avgLoss, numSimulations, numTrades]);

  const simulationKey = useMemo(
    () =>
      [
        parsed.startingCapital,
        parsed.winRate,
        parsed.avgWin,
        parsed.avgLoss,
        parsed.numSimulations,
        parsed.numTrades,
      ].join("|"),
    [parsed]
  );

  const isPreviewRun = parsed.numSimulations > AUTO_RUN_CAP;
  const canRun = parsed.startingCapital > 0 && parsed.avgWin >= 0 && parsed.avgLoss >= 0;

  function executeSimulation(forceFull = false) {
    if (!canRun) {
      setResult(null);
      return;
    }
    const simCount = forceFull ? parsed.numSimulations : Math.min(parsed.numSimulations, AUTO_RUN_CAP);
    const runKey = `${simulationKey}|${simCount}|${forceFull ? "full" : "auto"}`;
    if (runKey === lastRunKeyRef.current) return;
    lastRunKeyRef.current = runKey;

    startTransition(() => {
      setResult(runSimulation({ ...parsed, numSimulations: simCount }));
    });
  }

  useEffect(() => {
    if (!canRun) {
      setResult(null);
      lastRunKeyRef.current = "";
      return;
    }
    const timer = window.setTimeout(() => executeSimulation(false), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [simulationKey, canRun]);

  const maxBinCount = result ? Math.max(...result.bins.map((b) => b.count), 1) : 1;

  const copyText = result
    ? [
        "Monte Carlo",
        `p10: ${formatCurrency(result.p10)}`,
        `p50: ${formatCurrency(result.p50)}`,
        `p90: ${formatCurrency(result.p90)}`,
        `Ruin: ${(result.ruinShare * 100).toFixed(1)}%`,
        `Profit: ${(result.profitableShare * 100).toFixed(1)}%`,
        "Edukasi — bukan saran investasi.",
      ].join("\n")
    : "";

  return (
    <div className="flex flex-col gap-6">
      <LabCalculatorShell
        input={
          <LabToolPanel description={`Auto-run · maks. ${MAX_SIMULATIONS} simulasi`}>
            <div className="flex flex-col gap-5">
              <LabPresetBar
                activeId={activePreset}
                presets={[
                  { id: "conservative", label: "Konservatif" },
                  { id: "balanced", label: "Seimbang" },
                  { id: "aggressive", label: "Agresif" },
                ]}
                onSelect={(id) => {
                  setActivePreset(id);
                  if (id === "conservative") {
                    setStartingCapital("10000000");
                    setWinRate("40");
                    setAvgWin("2");
                    setAvgLoss("1");
                    setNumSimulations("200");
                    setNumTrades("50");
                  } else if (id === "balanced") {
                    setStartingCapital("10000000");
                    setWinRate("45");
                    setAvgWin("3");
                    setAvgLoss("1.5");
                    setNumSimulations("200");
                    setNumTrades("100");
                  } else {
                    setStartingCapital("10000000");
                    setWinRate("55");
                    setAvgWin("4");
                    setAvgLoss("2");
                    setNumSimulations("200");
                    setNumTrades("150");
                  }
                }}
              />
              {isPreviewRun && (
                <p className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                  Preview {AUTO_RUN_CAP} simulasi — hasil di bawah memakai sample. Jalankan penuh untuk{" "}
                  {parsed.numSimulations.toLocaleString("id-ID")} simulasi.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <LabField label="Modal awal" id="mc-capital" suffix="Rp">
                  <LabNumberInput id="mc-capital" value={startingCapital} onChange={setStartingCapital} min={0} />
                </LabField>
                <LabField label="Win rate" id="mc-winrate" suffix="%">
                  <LabNumberInput id="mc-winrate" value={winRate} onChange={setWinRate} min={0} max={100} />
                </LabField>
                <LabField label="Rata-rata untung / trade" id="mc-avgwin" suffix="%">
                  <LabNumberInput id="mc-avgwin" value={avgWin} onChange={setAvgWin} min={0} />
                </LabField>
                <LabField label="Rata-rata rugi / trade" id="mc-avgloss" suffix="%">
                  <LabNumberInput id="mc-avgloss" value={avgLoss} onChange={setAvgLoss} min={0} />
                </LabField>
                <LabField label="Jumlah simulasi" id="mc-numsim">
                  <LabNumberInput id="mc-numsim" value={numSimulations} onChange={setNumSimulations} min={10} max={MAX_SIMULATIONS} step={1} />
                </LabField>
                <LabField label="Trade per simulasi" id="mc-numtrades">
                  <LabNumberInput id="mc-numtrades" value={numTrades} onChange={setNumTrades} min={1} max={MAX_TRADES} step={1} />
                </LabField>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {isPending && (
                  <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    Menjalankan simulasi…
                  </p>
                )}
                {isPreviewRun && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => executeSimulation(true)}
                  >
                    Jalankan penuh ({parsed.numSimulations.toLocaleString("id-ID")} sim)
                  </Button>
                )}
              </div>
            </div>
          </LabToolPanel>
        }
        output={
          <LabOutputPanel footer={<LabCopyResults text={copyText} />}>
            {!result ? (
              <LabInterpretation>Isi parameter — simulasi berjalan otomatis.</LabInterpretation>
            ) : (
              <div className="flex flex-col gap-4">
                <LabInterpretation tone={result.p50 > result.startingCapital ? "positive" : "negative"}>
                  Median saldo akhir {result.p50 >= result.startingCapital ? "di atas" : "di bawah"} modal awal.
                  {result.ruinShare > 0.05 && " Probabilitas ruin signifikan — review risiko per trade."}
                </LabInterpretation>
                <LabResultGrid className="mt-0 grid-cols-1 gap-2">
                  <LabResultTile label="p10 (pesimis)" value={formatCurrency(result.p10)} tone="negative" />
                  <LabResultTile label="p50 (median)" value={formatCurrency(result.p50)} />
                  <LabResultTile label="p90 (optimis)" value={formatCurrency(result.p90)} tone="positive" />
                  <LabResultTile label="Peluang profit" value={`${(result.profitableShare * 100).toFixed(1)}%`} tone={result.profitableShare >= 0.5 ? "positive" : "negative"} />
                  <LabResultTile label="Probabilitas ruin" value={`${(result.ruinShare * 100).toFixed(1)}%`} tone={result.ruinShare > 0.1 ? "negative" : "neutral"} />
                  <LabResultTile label="Max DD (contoh path)" value={`${result.maxDrawdown.toFixed(1)}%`} tone="negative" />
                </LabResultGrid>
              </div>
            )}
          </LabOutputPanel>
        }
      />

      {result && (
        <>
          <LabToolPanel description="Satu simulasi acak — bukan median atau rata-rata semua jalur.">
            <EquityCurveChart curve={result.equityCurve} startingCapital={result.startingCapital} />
            <p className="mt-2 text-xs text-muted-foreground">
              Akhir: {formatCurrency(result.equityCurve[result.equityCurve.length - 1]?.equity ?? 0)}
            </p>
          </LabToolPanel>

          <LabToolPanel description={`${result.endings.length.toLocaleString("id-ID")} simulasi · sumbu = saldo akhir`}>
            <div className="rounded-lg border border-border/40 bg-muted/10 px-2 pb-8 pt-3">
              <div className="flex h-40 items-end gap-0.5">
                {result.bins.map((bin, i) => {
                  const heightPct = Math.max(2, (bin.count / maxBinCount) * 100);
                  const crossesStart =
                    bin.from <= result.startingCapital && result.startingCapital < bin.to;
                  const showLabel =
                    i === 0 || i === result.bins.length - 1 || i === Math.floor(result.bins.length / 2);
                  return (
                    <div
                      key={i}
                      className="flex min-w-0 flex-1 flex-col items-center justify-end"
                    >
                      <div
                        className={cn(
                          "w-full rounded-t-sm transition-all",
                          bin.from >= result.startingCapital ? "bg-profit/65" : "bg-loss/55",
                          crossesStart && "ring-1 ring-accent/60"
                        )}
                        style={{ height: `${heightPct}%`, minHeight: "4px" }}
                      />
                      {showLabel && (
                        <span className="mt-1.5 max-w-full truncate text-[9px] text-muted-foreground">
                          {bin.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-6 flex justify-between text-xs text-muted-foreground">
              <span>{formatCompact(result.worst)}</span>
              <span>Modal awal: {formatCompact(result.startingCapital)}</span>
              <span>{formatCompact(result.best)}</span>
            </div>
          </LabToolPanel>
        </>
      )}
    </div>
  );
}

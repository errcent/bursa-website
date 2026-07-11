"use client";

import { useMemo, useState, useTransition } from "react";
import { Dices, Loader2 } from "lucide-react";

import { LabField, LabNumberInput, LabResultTile } from "@/components/lab/lab-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_SIMULATIONS = 3000;
const MAX_TRADES = 400;
const HISTOGRAM_BINS = 16;

type SimulationResult = {
  endings: number[];
  median: number;
  mean: number;
  worst: number;
  best: number;
  startingCapital: number;
  profitableShare: number;
  bustShare: number;
  bins: { from: number; to: number; count: number }[];
};

function runSimulation({
  startingCapital,
  winRate,
  avgWin,
  avgLoss,
  numSimulations,
  numTrades,
}: {
  startingCapital: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  numSimulations: number;
  numTrades: number;
}): SimulationResult {
  const endings: number[] = new Array(numSimulations);

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
  }

  const sorted = [...endings].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const mean = endings.reduce((sum, v) => sum + v, 0) / endings.length;
  const worst = sorted[0];
  const best = sorted[sorted.length - 1];
  const profitableShare = endings.filter((v) => v > startingCapital).length / endings.length;
  const bustShare = endings.filter((v) => v <= startingCapital * 0.01).length / endings.length;

  const min = worst;
  const max = best;
  const range = Math.max(max - min, 1e-9);
  const binSize = range / HISTOGRAM_BINS;
  const bins = Array.from({ length: HISTOGRAM_BINS }, (_, i) => ({
    from: min + i * binSize,
    to: min + (i + 1) * binSize,
    count: 0,
  }));
  for (const value of endings) {
    const idx = Math.min(HISTOGRAM_BINS - 1, Math.floor((value - min) / binSize));
    bins[Math.max(0, idx)].count += 1;
  }

  return { endings, median, mean, worst, best, startingCapital, profitableShare, bustShare, bins };
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

export function MonteCarloSimulator() {
  const [startingCapital, setStartingCapital] = useState("10000000");
  const [winRate, setWinRate] = useState("45");
  const [avgWin, setAvgWin] = useState("3");
  const [avgLoss, setAvgLoss] = useState("1.5");
  const [numSimulations, setNumSimulations] = useState("500");
  const [numTrades, setNumTrades] = useState("100");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsed = useMemo(() => {
    return {
      startingCapital: Math.max(0, Number(startingCapital) || 0),
      winRate: Math.min(100, Math.max(0, Number(winRate) || 0)),
      avgWin: Math.max(0, Number(avgWin) || 0),
      avgLoss: Math.max(0, Number(avgLoss) || 0),
      numSimulations: Math.min(MAX_SIMULATIONS, Math.max(10, Math.floor(Number(numSimulations) || 0))),
      numTrades: Math.min(MAX_TRADES, Math.max(1, Math.floor(Number(numTrades) || 0))),
    };
  }, [startingCapital, winRate, avgWin, avgLoss, numSimulations, numTrades]);

  function handleRun() {
    startTransition(() => {
      setResult(runSimulation(parsed));
    });
  }

  const maxBinCount = result ? Math.max(...result.bins.map((b) => b.count), 1) : 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="surface-card p-5 sm:p-6">
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
          <LabField
            label="Jumlah simulasi"
            id="mc-numsim"
            helperText={`Maks. ${MAX_SIMULATIONS.toLocaleString("id-ID")}`}
          >
            <LabNumberInput
              id="mc-numsim"
              value={numSimulations}
              onChange={setNumSimulations}
              min={10}
              max={MAX_SIMULATIONS}
              step={1}
            />
          </LabField>
          <LabField
            label="Jumlah trade per simulasi"
            id="mc-numtrades"
            helperText={`Maks. ${MAX_TRADES.toLocaleString("id-ID")}`}
          >
            <LabNumberInput
              id="mc-numtrades"
              value={numTrades}
              onChange={setNumTrades}
              min={1}
              max={MAX_TRADES}
              step={1}
            />
          </LabField>
        </div>

        <Button onClick={handleRun} disabled={isPending} className="btn-primary mt-5 h-11 w-full sm:w-auto">
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Menjalankan simulasi...
            </>
          ) : (
            <>
              <Dices className="size-4" />
              Jalankan simulasi
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <LabResultTile label="Median saldo akhir" value={formatCurrency(result.median)} />
            <LabResultTile
              label="Worst case (terburuk)"
              value={formatCurrency(result.worst)}
              tone="negative"
            />
            <LabResultTile label="Best case (terbaik)" value={formatCurrency(result.best)} tone="positive" />
            <LabResultTile
              label="Peluang profit"
              value={`${(result.profitableShare * 100).toFixed(1)}%`}
              tone={result.profitableShare >= 0.5 ? "positive" : "negative"}
            />
          </div>

          <div className="surface-card p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-heading text-base font-semibold">Distribusi saldo akhir</h3>
              <p className="text-xs text-muted-foreground">
                {result.endings.length.toLocaleString("id-ID")} simulasi ·{" "}
                {result.bustShare > 0 ? `${(result.bustShare * 100).toFixed(1)}% hampir habis modal` : "0% hampir habis modal"}
              </p>
            </div>

            <div className="flex h-48 items-end gap-1">
              {result.bins.map((bin, i) => {
                const heightPct = Math.max(2, (bin.count / maxBinCount) * 100);
                const crossesStart = bin.from <= result.startingCapital && result.startingCapital < bin.to;
                return (
                  <div key={i} className="group relative flex-1" style={{ height: "100%" }}>
                    <div
                      className={cn(
                        "absolute bottom-0 w-full rounded-t-sm transition-all",
                        bin.from >= result.startingCapital ? "bg-profit/70" : "bg-loss/60",
                        crossesStart && "ring-2 ring-accent/60"
                      )}
                      style={{ height: `${heightPct}%` }}
                    />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[11px] text-popover-foreground shadow-lg group-hover:block">
                      {formatCompact(bin.from)} – {formatCompact(bin.to)}
                      <br />
                      {bin.count} simulasi
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{formatCompact(result.worst)}</span>
              <span>Garis biru = titik modal awal</span>
              <span>{formatCompact(result.best)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

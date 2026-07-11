"use client";

import { useMemo, useState } from "react";

import { LabField, LabNumberInput, LabResultTile } from "@/components/lab/lab-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  generateSamplePrices,
  maCrossoverBacktest,
  parameterOptimization,
  parsePrices,
  rsiBacktest,
  seasonalityAnalysis,
  walkForwardAnalysis,
} from "@/lib/lab/backtesting";

function fmt(n: number, d = 2): string {
  return n.toLocaleString("id-ID", { maximumFractionDigits: d });
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function BacktesterTool() {
  const [prices, setPrices] = useState("");
  const [fast, setFast] = useState("5");
  const [slow, setSlow] = useState("20");
  const [rsiPeriod, setRsiPeriod] = useState("14");
  const [oversold, setOversold] = useState("30");
  const [overbought, setOverbought] = useState("70");

  const priceData = useMemo(() => {
    const parsed = parsePrices(prices);
    return parsed.length >= 30 ? parsed : generateSamplePrices(200);
  }, [prices]);

  const maResult = useMemo(() => maCrossoverBacktest(priceData, parseInt(fast) || 5, parseInt(slow) || 20), [priceData, fast, slow]);
  const rsiResult = useMemo(() => rsiBacktest(priceData, parseInt(rsiPeriod) || 14, parseFloat(oversold) || 30, parseFloat(overbought) || 70), [priceData, rsiPeriod, oversold, overbought]);

  const loadSample = () => setPrices(generateSamplePrices(200).join(", "));

  return (
    <div className="surface-card p-5 sm:p-6">
      <LabField label="Data harga (pisahkan koma)" id="bt-prices" helperText="Kosongkan untuk menggunakan data sample otomatis">
        <input id="bt-prices" value={prices} onChange={(e) => setPrices(e.target.value)}
          className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none" />
      </LabField>
      <button type="button" onClick={loadSample} className="mt-2 text-sm text-accent hover:underline">Muat data sample</button>

      <Tabs defaultValue="ma" className="mt-6">
        <TabsList>
          <TabsTrigger value="ma">MA Crossover</TabsTrigger>
          <TabsTrigger value="rsi">RSI</TabsTrigger>
        </TabsList>
        <TabsContent value="ma">
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <LabField label="Fast MA" id="bt-fast"><LabNumberInput id="bt-fast" value={fast} onChange={setFast} min={1} /></LabField>
            <LabField label="Slow MA" id="bt-slow"><LabNumberInput id="bt-slow" value={slow} onChange={setSlow} min={2} /></LabField>
          </div>
          <ResultPanel result={maResult} />
        </TabsContent>
        <TabsContent value="rsi">
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <LabField label="RSI period" id="bt-rsi-p"><LabNumberInput id="bt-rsi-p" value={rsiPeriod} onChange={setRsiPeriod} min={2} /></LabField>
            <LabField label="Oversold" id="bt-os"><LabNumberInput id="bt-os" value={oversold} onChange={setOversold} min={0} max={50} /></LabField>
            <LabField label="Overbought" id="bt-ob"><LabNumberInput id="bt-ob" value={overbought} onChange={setOverbought} min={50} max={100} /></LabField>
          </div>
          <ResultPanel result={rsiResult} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ResultPanel({ result }: { result: ReturnType<typeof maCrossoverBacktest> }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <LabResultTile label="Total return" value={`${fmt(result.totalReturn)}%`} tone={result.totalReturn > 0 ? "positive" : "negative"} />
      <LabResultTile label="Win rate" value={`${fmt(result.winRate)}%`} />
      <LabResultTile label="Max drawdown" value={`${fmt(result.maxDrawdown)}%`} tone="negative" />
      <LabResultTile label="Sharpe ratio" value={fmt(result.sharpe)} />
      <LabResultTile label="Jumlah trade" value={`${result.trades.length}`} className="sm:col-span-2 lg:col-span-4" />
    </div>
  );
}

export function WalkForwardTool() {
  const [ratio, setRatio] = useState("0.7");
  const [result, setResult] = useState<ReturnType<typeof walkForwardAnalysis> | null>(null);

  const run = () => {
    const prices = generateSamplePrices(300);
    setResult(walkForwardAnalysis(prices, parseFloat(ratio) || 0.7, [3, 15], [10, 40]));
  };

  return (
    <div className="surface-card p-5 sm:p-6">
      <LabField label="In-sample ratio" id="wf-ratio" helperText="Proporsi data untuk optimasi parameter (sisanya out-of-sample)">
        <LabNumberInput id="wf-ratio" value={ratio} onChange={setRatio} min={0.5} max={0.9} step={0.05} />
      </LabField>
      <button type="button" onClick={run} className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">Jalankan walk-forward</button>
      {result && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">In-sample (MA {result.inSample.fast}/{result.inSample.slow})</p>
            <div className="grid gap-2">
              <LabResultTile label="Return" value={`${fmt(result.inSample.totalReturn)}%`} />
              <LabResultTile label="Win rate" value={`${fmt(result.inSample.winRate)}%`} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Out-of-sample</p>
            <div className="grid gap-2">
              <LabResultTile label="Return" value={`${fmt(result.outOfSample.totalReturn)}%`} tone={result.outOfSample.totalReturn > 0 ? "positive" : "negative"} />
              <LabResultTile label="Win rate" value={`${fmt(result.outOfSample.winRate)}%`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ParameterOptimizationTool() {
  const [results, setResults] = useState<ReturnType<typeof parameterOptimization>>([]);

  const run = () => {
    const prices = generateSamplePrices(250);
    setResults(parameterOptimization(prices, [3, 12], [15, 50]).slice(0, 15));
  };

  return (
    <div className="surface-card p-5 sm:p-6">
      <p className="text-sm text-muted-foreground">Grid search MA crossover pada data sample. Klik untuk menjalankan.</p>
      <button type="button" onClick={run} className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">Optimasi parameter</button>
      {results.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-4">Fast</th><th className="py-2 pr-4">Slow</th><th className="py-2 pr-4">Return</th><th className="py-2 pr-4">Win%</th><th className="py-2">Sharpe</th>
            </tr></thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className={`border-b border-border/40 ${i === 0 ? "bg-accent-soft/30" : ""}`}>
                  <td className="py-2 pr-4">{r.fast}</td>
                  <td className="py-2 pr-4">{r.slow}</td>
                  <td className={`py-2 pr-4 ${r.totalReturn > 0 ? "text-profit" : "text-loss"}`}>{fmt(r.totalReturn)}%</td>
                  <td className="py-2 pr-4">{fmt(r.winRate)}%</td>
                  <td className="py-2">{fmt(r.sharpe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function SeasonalityAnalyzer() {
  const [returns, setReturns] = useState("2, -1, 3, 1, -2, 4, 0.5, -3, 2, 5, -1, 1, 3, -0.5, 2, 4, -2, 1, 3, 2, -1, 4, 1, -2");
  const [analysis, setAnalysis] = useState<ReturnType<typeof seasonalityAnalysis>>([]);

  const run = () => {
    const data = returns.split(/[,;\s]+/).map(Number).filter((n) => !isNaN(n));
    setAnalysis(seasonalityAnalysis(data));
  };

  return (
    <div className="surface-card p-5 sm:p-6">
      <LabField label="Return bulanan historis (%)" id="sea-ret" helperText="Minimal 12 bulan data, pisahkan koma">
        <input id="sea-ret" value={returns} onChange={(e) => setReturns(e.target.value)}
          className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none" />
      </LabField>
      <button type="button" onClick={run} className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">Analisis musiman</button>
      {analysis.length > 0 && (
        <div className="mt-6">
          <div className="flex h-40 items-end gap-2">
            {analysis.map((m) => {
              const h = Math.max(4, Math.abs(m.avgReturn) * 8);
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <div className={`w-full rounded-t ${m.avgReturn >= 0 ? "bg-profit/60" : "bg-loss/60"}`} style={{ height: `${h}px` }} />
                  <span className="text-[10px] text-muted-foreground">{MONTHS[m.month - 1]}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4">Bulan</th><th className="py-2 pr-4">Avg return</th><th className="py-2">Win rate</th>
              </tr></thead>
              <tbody>
                {analysis.map((m) => (
                  <tr key={m.month} className="border-b border-border/40">
                    <td className="py-2 pr-4">{MONTHS[m.month - 1]}</td>
                    <td className={`py-2 pr-4 ${m.avgReturn >= 0 ? "text-profit" : "text-loss"}`}>{fmt(m.avgReturn)}%</td>
                    <td className="py-2">{fmt(m.winRate)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

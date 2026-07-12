"use client";

import { useMemo, useState } from "react";

import { LabField, LabNumberInput, LabResultTile } from "@/components/lab/lab-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  generateSamplePrices,
  maCrossoverBacktest,
  parsePrices,
  rsiBacktest,
} from "@/lib/lab/backtesting";

function fmt(n: number, d = 2): string {
  return n.toLocaleString("id-ID", { maximumFractionDigits: d });
}

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

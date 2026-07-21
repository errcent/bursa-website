"use client";

import { useMemo, useState } from "react";

import {
  LabDirectionToggle,
  LabField,
  LabNumberInput,
  LabResultGrid,
  LabResultTile,
  LabToolPanel,
  labInputClassName,
} from "@/components/lab/lab-field";
import {
  atrTrailingStop,
  fibonacciLevels,
  historicalVolatility,
  impliedVolatilityApprox,
  rMultipleStats,
} from "@/lib/lab/technical";

function fmt(n: number, d = 2): string {
  return n.toLocaleString("id-ID", { maximumFractionDigits: d });
}

export function VolatilityCalculator() {
  const [prices, setPrices] = useState("100, 102, 98, 105, 103, 107, 101, 110");
  const [optPrice, setOptPrice] = useState("5");
  const [stockPrice, setStockPrice] = useState("100");
  const [strike, setStrike] = useState("100");
  const [days, setDays] = useState("30");

  const histVol = useMemo(() => {
    const p = prices.split(/[,;\s]+/).map(Number).filter((n) => !isNaN(n));
    return historicalVolatility(p);
  }, [prices]);

  const implVol = useMemo(() => impliedVolatilityApprox({
    optionPrice: parseFloat(optPrice) || 0,
    stockPrice: parseFloat(stockPrice) || 0,
    strikePrice: parseFloat(strike) || 0,
    daysToExpiry: parseFloat(days) || 0,
  }), [optPrice, stockPrice, strike, days]);

  return (
    <LabToolPanel title="Volatilitas historis & implied" description="Historical vol dari seri harga; implied vol memakai aproksimasi Brenner-Subrahmanyam.">
      <LabField label="Harga historis (pisahkan koma)" id="vol-prices">
        <input id="vol-prices" value={prices} onChange={(e) => setPrices(e.target.value)} className={labInputClassName} />
      </LabField>
      <LabResultGrid className="lg:grid-cols-2">
        <LabResultTile label="Historical vol (annualized)" value={`${fmt(histVol)}%`} />
        <LabResultTile label="Implied vol (approx)" value={`${fmt(implVol)}%`} />
      </LabResultGrid>
      <p className="mt-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">Implied vol (opsional)</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LabField label="Harga opsi" id="vol-op"><LabNumberInput id="vol-op" value={optPrice} onChange={setOptPrice} min={0} /></LabField>
        <LabField label="Harga underlying" id="vol-sp"><LabNumberInput id="vol-sp" value={stockPrice} onChange={setStockPrice} min={0} /></LabField>
        <LabField label="Strike" id="vol-st"><LabNumberInput id="vol-st" value={strike} onChange={setStrike} min={0} /></LabField>
        <LabField label="Hari ke expiry" id="vol-d"><LabNumberInput id="vol-d" value={days} onChange={setDays} min={0} /></LabField>
      </div>
    </LabToolPanel>
  );
}

export function AtrTrailingStopCalculator() {
  const [price, setPrice] = useState("5000");
  const [atr, setAtr] = useState("100");
  const [mult, setMult] = useState("2");
  const [direction, setDirection] = useState<"long" | "short">("long");

  const result = useMemo(() => atrTrailingStop({
    price: parseFloat(price) || 0,
    atr: parseFloat(atr) || 0,
    multiplier: parseFloat(mult) || 0,
    direction,
  }), [price, atr, mult, direction]);

  return (
    <LabToolPanel title="Trailing stop berbasis ATR">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Harga saat ini" id="atr-p"><LabNumberInput id="atr-p" value={price} onChange={setPrice} min={0} /></LabField>
        <LabField label="ATR" id="atr-a"><LabNumberInput id="atr-a" value={atr} onChange={setAtr} min={0} /></LabField>
        <LabField label="Multiplier" id="atr-m"><LabNumberInput id="atr-m" value={mult} onChange={setMult} min={0} step={0.5} /></LabField>
      </div>
      <div className="mt-4">
        <LabDirectionToggle value={direction} onChange={setDirection} />
      </div>
      <LabResultGrid className="lg:grid-cols-3">
        <LabResultTile label="Level stop" value={fmt(result.stopLevel)} tone="negative" />
        <LabResultTile label="Jarak stop" value={fmt(result.distance)} />
        <LabResultTile label="Jarak %" value={`${fmt(result.distancePercent)}%`} />
      </LabResultGrid>
    </LabToolPanel>
  );
}

export function FibonacciCalculator() {
  const [high, setHigh] = useState("5500");
  const [low, setLow] = useState("4800");
  const levels = useMemo(() => {
    const h = parseFloat(high);
    const l = parseFloat(low);
    if (!h || !l) return null;
    return fibonacciLevels(h, l);
  }, [high, low]);

  return (
    <LabToolPanel title="Level Fibonacci" description="Retracement dari swing high ke low; extension melanjutkan range di atas high.">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Swing high" id="fib-h"><LabNumberInput id="fib-h" value={high} onChange={setHigh} min={0} /></LabField>
        <LabField label="Swing low" id="fib-l"><LabNumberInput id="fib-l" value={low} onChange={setLow} min={0} /></LabField>
      </div>
      {levels && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <p className="mb-3 font-heading text-sm font-semibold">Retracement</p>
            {levels.retracements.map((l) => (
              <div key={l.level} className="flex justify-between border-b border-border/40 py-2 text-sm last:border-0">
                <span className="text-muted-foreground">{l.level}</span><span className="font-medium tabular-nums">{fmt(l.price)}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <p className="mb-3 font-heading text-sm font-semibold">Extension</p>
            {levels.extensions.map((l) => (
              <div key={l.level} className="flex justify-between border-b border-border/40 py-2 text-sm last:border-0">
                <span className="text-muted-foreground">{l.level}</span><span className="font-medium tabular-nums">{fmt(l.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </LabToolPanel>
  );
}

export function RMultipleTracker() {
  const [tradesInput, setTradesInput] = useState("2, -1, 3, -1, 1, -2, 4, -1, 2");
  const stats = useMemo(() => {
    const trades = tradesInput.split(/[,;\s]+/).map(Number).filter((n) => !isNaN(n));
    return rMultipleStats(trades);
  }, [tradesInput]);

  return (
    <LabToolPanel title="Statistik R-multiple" description="Masukkan hasil trade dalam satuan R — 1R = risiko awal per trade.">
      <LabField label="R-multiples (pisahkan koma)" id="rm-trades" helperText="Contoh: 2, -1, 3, -1">
        <input id="rm-trades" value={tradesInput} onChange={(e) => setTradesInput(e.target.value)} className={labInputClassName} />
      </LabField>
      <LabResultGrid>
        <LabResultTile label="Total R" value={`${fmt(stats.totalR)}R`} tone={stats.totalR > 0 ? "positive" : "negative"} />
        <LabResultTile label="Rata-rata R" value={`${fmt(stats.avgR)}R`} />
        <LabResultTile label="Win rate" value={`${fmt(stats.winRate)}%`} />
        <LabResultTile label="Expectancy" value={`${fmt(stats.expectancy)}R`} tone={stats.expectancy > 0 ? "positive" : "negative"} />
      </LabResultGrid>
    </LabToolPanel>
  );
}

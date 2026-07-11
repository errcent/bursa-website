"use client";

import { useMemo, useState } from "react";

import { LabField, LabNumberInput, LabResultTile } from "@/components/lab/lab-field";
import {
  atrTrailingStop,
  beta,
  correlationMatrix,
  fibonacciLevels,
  historicalVolatility,
  impliedVolatilityApprox,
  parseReturns,
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
    <div className="surface-card p-5 sm:p-6">
      <LabField label="Harga historis (pisahkan koma)" id="vol-prices">
        <input id="vol-prices" value={prices} onChange={(e) => setPrices(e.target.value)}
          className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none" />
      </LabField>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <LabResultTile label="Historical vol (annualized)" value={`${fmt(histVol)}%`} />
        <LabResultTile label="Implied vol (approx)" value={`${fmt(implVol)}%`} />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Implied vol (opsional):</p>
      <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LabField label="Option price" id="vol-op"><LabNumberInput id="vol-op" value={optPrice} onChange={setOptPrice} min={0} /></LabField>
        <LabField label="Stock price" id="vol-sp"><LabNumberInput id="vol-sp" value={stockPrice} onChange={setStockPrice} min={0} /></LabField>
        <LabField label="Strike" id="vol-st"><LabNumberInput id="vol-st" value={strike} onChange={setStrike} min={0} /></LabField>
        <LabField label="Days to expiry" id="vol-d"><LabNumberInput id="vol-d" value={days} onChange={setDays} min={0} /></LabField>
      </div>
    </div>
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
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Harga saat ini" id="atr-p"><LabNumberInput id="atr-p" value={price} onChange={setPrice} min={0} /></LabField>
        <LabField label="ATR" id="atr-a"><LabNumberInput id="atr-a" value={atr} onChange={setAtr} min={0} /></LabField>
        <LabField label="Multiplier" id="atr-m"><LabNumberInput id="atr-m" value={mult} onChange={setMult} min={0} step={0.5} /></LabField>
      </div>
      <div className="mt-3 flex gap-2">
        {(["long", "short"] as const).map((d) => (
          <button key={d} type="button" onClick={() => setDirection(d)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${direction === d ? "bg-accent-soft text-accent" : "text-muted-foreground"}`}>
            {d === "long" ? "Long" : "Short"}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <LabResultTile label="Stop level" value={fmt(result.stopLevel)} tone="negative" />
        <LabResultTile label="Jarak stop" value={fmt(result.distance)} />
        <LabResultTile label="Jarak %" value={`${fmt(result.distancePercent)}%`} />
      </div>
    </div>
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
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Swing high" id="fib-h"><LabNumberInput id="fib-h" value={high} onChange={setHigh} min={0} /></LabField>
        <LabField label="Swing low" id="fib-l"><LabNumberInput id="fib-l" value={low} onChange={setLow} min={0} /></LabField>
      </div>
      {levels && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Retracement</p>
            {levels.retracements.map((l) => (
              <div key={l.level} className="flex justify-between border-b border-border/40 py-1.5 text-sm">
                <span className="text-muted-foreground">{l.level}</span><span>{fmt(l.price)}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Extension</p>
            {levels.extensions.map((l) => (
              <div key={l.level} className="flex justify-between border-b border-border/40 py-1.5 text-sm">
                <span className="text-muted-foreground">{l.level}</span><span>{fmt(l.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RMultipleTracker() {
  const [tradesInput, setTradesInput] = useState("2, -1, 3, -1, 1, -2, 4, -1, 2");

  const stats = useMemo(() => {
    const trades = tradesInput.split(/[,;\s]+/).map(Number).filter((n) => !isNaN(n));
    return rMultipleStats(trades);
  }, [tradesInput]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <LabField label="R-multiples (pisahkan koma)" id="rm-trades" helperText="Contoh: 2, -1, 3, -1">
        <input id="rm-trades" value={tradesInput} onChange={(e) => setTradesInput(e.target.value)}
          className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none" />
      </LabField>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <LabResultTile label="Total R" value={`${fmt(stats.totalR)}R`} tone={stats.totalR > 0 ? "positive" : "negative"} />
        <LabResultTile label="Avg R" value={`${fmt(stats.avgR)}R`} />
        <LabResultTile label="Win rate" value={`${fmt(stats.winRate)}%`} />
        <LabResultTile label="Expectancy" value={`${fmt(stats.expectancy)}R`} tone={stats.expectancy > 0 ? "positive" : "negative"} />
      </div>
    </div>
  );
}

export function CorrelationMatrixTool() {
  const [asset1, setAsset1] = useState("1, 2, -1, 3, 1, -2, 2");
  const [asset2, setAsset2] = useState("0.5, 1.5, -0.5, 2, 0.8, -1.5, 1.5");
  const [asset3, setAsset3] = useState("2, 1, -2, 4, 2, -3, 3");

  const matrix = useMemo(() => {
    const returns = [asset1, asset2, asset3].map(parseReturns).filter((r) => r.length >= 2);
    if (returns.length < 2) return null;
    return correlationMatrix(returns);
  }, [asset1, asset2, asset3]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4">
        {(["Aset 1", "Aset 2", "Aset 3"] as const).map((label, i) => {
          const [val, setVal] = [asset1, asset2, asset3][i];
          const setter = [setAsset1, setAsset2, setAsset3][i];
          return (
            <LabField key={label} label={`Return ${label} (%)`} id={`corr-${i}`}>
              <input id={`corr-${i}`} value={val} onChange={(e) => setter(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none" />
            </LabField>
          );
        })}
      </div>
      {matrix && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-muted-foreground">
              <th className="py-2 pr-2" /><th className="py-2 px-2">A1</th><th className="py-2 px-2">A2</th><th className="py-2 px-2">A3</th>
            </tr></thead>
            <tbody>
              {matrix.matrix.map((row, i) => (
                <tr key={i}>
                  <td className="py-2 pr-2 font-medium">A{i + 1}</td>
                  {row.map((v, j) => (
                    <td key={j} className={`py-2 px-2 text-center ${i === j ? "text-muted-foreground" : Math.abs(v) > 0.7 ? "text-loss font-medium" : ""}`}>
                      {fmt(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function BetaCalculatorTool() {
  const [stock, setStock] = useState("2, -1, 3, 1, -2, 4, 1, -1, 2");
  const [market, setMarket] = useState("1, -0.5, 2, 0.5, -1, 2.5, 0.5, -0.5, 1.5");

  const result = useMemo(() => beta(parseReturns(stock), parseReturns(market)), [stock, market]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4">
        <LabField label="Return saham (%)" id="beta-s">
          <input id="beta-s" value={stock} onChange={(e) => setStock(e.target.value)}
            className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none" />
        </LabField>
        <LabField label="Return indeks (%)" id="beta-m">
          <input id="beta-m" value={market} onChange={(e) => setMarket(e.target.value)}
            className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none" />
        </LabField>
      </div>
      <div className="mt-6">
        <LabResultTile label="Beta" value={fmt(result)}
          tone={result > 1 ? "negative" : result < 1 ? "positive" : "neutral"} />
        <p className="mt-2 text-xs text-muted-foreground">
          {result > 1 ? "Lebih volatil dari pasar" : result < 1 ? "Kurang volatil dari pasar" : "Sejalan dengan pasar"}
        </p>
      </div>
    </div>
  );
}

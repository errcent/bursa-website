"use client";

import { useMemo, useState } from "react";

import { LabField, LabNumberInput, LabResultTile } from "@/components/lab/lab-field";
import {
  cagr,
  inflationAdjustedReturn,
  minVarianceAllocation,
  rebalancingTrades,
  taxImpact,
  valueAtRisk,
} from "@/lib/lab/portfolio";

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

export function AssetAllocationOptimizer() {
  const [volA, setVolA] = useState("20");
  const [volB, setVolB] = useState("30");
  const [corr, setCorr] = useState("0.3");

  const result = useMemo(() => minVarianceAllocation({
    volA: parseFloat(volA) || 0,
    volB: parseFloat(volB) || 0,
    correlation: parseFloat(corr) || 0,
  }), [volA, volB, corr]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <LabField label="Volatilitas Aset A" id="aa-va" suffix="%"><LabNumberInput id="aa-va" value={volA} onChange={setVolA} min={0} /></LabField>
        <LabField label="Volatilitas Aset B" id="aa-vb" suffix="%"><LabNumberInput id="aa-vb" value={volB} onChange={setVolB} min={0} /></LabField>
        <LabField label="Korelasi A-B" id="aa-c"><LabNumberInput id="aa-c" value={corr} onChange={setCorr} min={-1} max={1} step={0.1} /></LabField>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <LabResultTile label="Weight Aset A" value={`${fmt(result.weightA)}%`} />
        <LabResultTile label="Weight Aset B" value={`${fmt(result.weightB)}%`} />
        <LabResultTile label="Portfolio vol" value={`${fmt(result.portfolioVol)}%`} />
      </div>
    </div>
  );
}

export function RebalancingCalculator() {
  const [a1val, setA1val] = useState("500000000");
  const [a1target, setA1target] = useState("40");
  const [a2val, setA2val] = useState("300000000");
  const [a2target, setA2target] = useState("30");
  const [a3val, setA3val] = useState("200000000");
  const [a3target, setA3target] = useState("30");

  const result = useMemo(() => rebalancingTrades({
    assets: [
      { name: "Saham", currentValue: parseFloat(a1val) || 0, targetPercent: parseFloat(a1target) || 0 },
      { name: "Obligasi", currentValue: parseFloat(a2val) || 0, targetPercent: parseFloat(a2target) || 0 },
      { name: "Cash", currentValue: parseFloat(a3val) || 0, targetPercent: parseFloat(a3target) || 0 },
    ],
  }), [a1val, a1target, a2val, a2target, a3val, a3target]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LabField label="Saham (nilai)" id="rb-a1" suffix="Rp"><LabNumberInput id="rb-a1" value={a1val} onChange={setA1val} min={0} /></LabField>
        <LabField label="Saham (target %)" id="rb-t1" suffix="%"><LabNumberInput id="rb-t1" value={a1target} onChange={setA1target} min={0} max={100} /></LabField>
        <LabField label="Obligasi (nilai)" id="rb-a2" suffix="Rp"><LabNumberInput id="rb-a2" value={a2val} onChange={setA2val} min={0} /></LabField>
        <LabField label="Obligasi (target %)" id="rb-t2" suffix="%"><LabNumberInput id="rb-t2" value={a2target} onChange={setA2target} min={0} max={100} /></LabField>
        <LabField label="Cash (nilai)" id="rb-a3" suffix="Rp"><LabNumberInput id="rb-a3" value={a3val} onChange={setA3val} min={0} /></LabField>
        <LabField label="Cash (target %)" id="rb-t3" suffix="%"><LabNumberInput id="rb-t3" value={a3target} onChange={setA3target} min={0} max={100} /></LabField>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Total portofolio: Rp {fmt(result.totalValue, 0)}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2 pr-4">Aset</th><th className="py-2 pr-4">Saat ini</th><th className="py-2 pr-4">Target</th><th className="py-2">Trade</th>
          </tr></thead>
          <tbody>
            {result.trades.map((t) => (
              <tr key={t.name} className="border-b border-border/40">
                <td className="py-2 pr-4">{t.name}</td>
                <td className="py-2 pr-4">{fmt(t.currentPercent)}%</td>
                <td className="py-2 pr-4">{fmt(t.targetPercent)}%</td>
                <td className={`py-2 font-medium ${t.tradeAmount > 0 ? "text-profit" : t.tradeAmount < 0 ? "text-loss" : ""}`}>
                  {t.tradeAmount > 0 ? "+" : ""}Rp {fmt(t.tradeAmount, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TaxImpactSimulator() {
  const [buy, setBuy] = useState("5000");
  const [sell, setSell] = useState("6000");
  const [qty, setQty] = useState("100");
  const [tax, setTax] = useState("0.1");

  const result = useMemo(() => taxImpact({
    buyPrice: parseFloat(buy) || 0,
    sellPrice: parseFloat(sell) || 0,
    quantity: parseFloat(qty) || 0,
    taxRate: parseFloat(tax) || 0,
  }), [buy, sell, qty, tax]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Harga beli" id="tax-b"><LabNumberInput id="tax-b" value={buy} onChange={setBuy} min={0} /></LabField>
        <LabField label="Harga jual" id="tax-s"><LabNumberInput id="tax-s" value={sell} onChange={setSell} min={0} /></LabField>
        <LabField label="Jumlah lembar" id="tax-q"><LabNumberInput id="tax-q" value={qty} onChange={setQty} min={0} /></LabField>
        <LabField label="Pajak capital gain" id="tax-r" suffix="%"><LabNumberInput id="tax-r" value={tax} onChange={setTax} min={0} /></LabField>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <LabResultTile label="Gross gain" value={`Rp ${fmt(result.grossGain, 0)}`} tone={result.grossGain > 0 ? "positive" : "negative"} />
        <LabResultTile label="Pajak" value={`Rp ${fmt(result.tax, 0)}`} tone="negative" />
        <LabResultTile label="Net gain" value={`Rp ${fmt(result.netGain, 0)}`} />
        <LabResultTile label="Net return" value={`${fmt(result.netReturn)}%`} />
      </div>
    </div>
  );
}

export function InflationAdjustedCalculator() {
  const [nominal, setNominal] = useState("12");
  const [inflation, setInflation] = useState("3.5");
  const [begin, setBegin] = useState("100000000");
  const [years, setYears] = useState("5");

  const real = useMemo(() => inflationAdjustedReturn(parseFloat(nominal) || 0, parseFloat(inflation) || 0), [nominal, inflation]);

  const endValue = useMemo(() => {
    const b = parseFloat(begin) || 0;
    const r = real.realReturn / 100;
    const y = parseInt(years) || 1;
    return b * Math.pow(1 + r, y);
  }, [begin, real.realReturn, years]);

  const nominalCagr = useMemo(() => {
    const b = parseFloat(begin) || 0;
    const n = parseFloat(nominal) || 0;
    const y = parseInt(years) || 1;
    return cagr(b, b * Math.pow(1 + n / 100, y), y);
  }, [begin, nominal, years]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LabField label="Return nominal" id="inf-n" suffix="%"><LabNumberInput id="inf-n" value={nominal} onChange={setNominal} /></LabField>
        <LabField label="Inflasi" id="inf-i" suffix="%"><LabNumberInput id="inf-i" value={inflation} onChange={setInflation} /></LabField>
        <LabField label="Modal awal" id="inf-b" suffix="Rp"><LabNumberInput id="inf-b" value={begin} onChange={setBegin} min={0} /></LabField>
        <LabField label="Tahun" id="inf-y"><LabNumberInput id="inf-y" value={years} onChange={setYears} min={1} /></LabField>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <LabResultTile label="Real return" value={`${fmt(real.realReturn)}%`} tone={real.realReturn > 0 ? "positive" : "negative"} />
        <LabResultTile label="Nilai akhir (real)" value={`Rp ${fmt(endValue, 0)}`} />
        <LabResultTile label="CAGR nominal" value={`${fmt(nominalCagr)}%`} />
      </div>
    </div>
  );
}

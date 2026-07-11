"use client";

import { useMemo, useState } from "react";

import { LabField, LabNumberInput, LabResultTile } from "@/components/lab/lab-field";
import {
  dividendDiscountModel,
  duPontRoe,
  grahamNumber,
  multiStageDdm,
  pegRatio,
  projectEarnings,
  projectRoe,
} from "@/lib/lab/valuation";

function fmt(n: number, d = 2): string {
  return n.toLocaleString("id-ID", { maximumFractionDigits: d });
}

export function DdmCalculator() {
  const [dividend, setDividend] = useState("200");
  const [growth, setGrowth] = useState("5");
  const [discount, setDiscount] = useState("10");
  const [useMulti, setUseMulti] = useState(false);
  const [highYears, setHighYears] = useState("5");
  const [stableGrowth, setStableGrowth] = useState("3");

  const result = useMemo(() => {
    const d = parseFloat(dividend);
    const g = parseFloat(growth);
    const r = parseFloat(discount);
    if (!d || !g || !r) return null;
    if (useMulti) {
      return multiStageDdm({ dividend: d, highGrowthRate: g, stableGrowthRate: parseFloat(stableGrowth) || 0, discountRate: r, highGrowthYears: parseInt(highYears) || 5 });
    }
    return dividendDiscountModel({ dividend: d, growthRate: g, discountRate: r });
  }, [dividend, growth, discount, useMulti, highYears, stableGrowth]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Dividen per lembar (DPS)" id="ddm-div"><LabNumberInput id="ddm-div" value={dividend} onChange={setDividend} min={0} /></LabField>
        <LabField label="Growth rate" id="ddm-g" suffix="%"><LabNumberInput id="ddm-g" value={growth} onChange={setGrowth} /></LabField>
        <LabField label="Discount rate" id="ddm-r" suffix="%"><LabNumberInput id="ddm-r" value={discount} onChange={setDiscount} /></LabField>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={useMulti} onChange={(e) => setUseMulti(e.target.checked)} className="size-4 rounded" />
        Multi-stage growth
      </label>
      {useMulti && (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <LabField label="Tahun high growth" id="ddm-hy"><LabNumberInput id="ddm-hy" value={highYears} onChange={setHighYears} min={1} /></LabField>
          <LabField label="Stable growth" id="ddm-sg" suffix="%"><LabNumberInput id="ddm-sg" value={stableGrowth} onChange={setStableGrowth} /></LabField>
        </div>
      )}
      {result != null && result > 0 && (
        <div className="mt-6"><LabResultTile label="Fair value (DDM)" value={fmt(result)} tone="positive" /></div>
      )}
    </div>
  );
}

export function GrahamNumberCalculator() {
  const [eps, setEps] = useState("500");
  const [bvps, setBvps] = useState("3000");

  const result = useMemo(() => {
    const e = parseFloat(eps);
    const b = parseFloat(bvps);
    if (!e || !b) return null;
    return grahamNumber(e, b);
  }, [eps, bvps]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="EPS" id="gn-eps"><LabNumberInput id="gn-eps" value={eps} onChange={setEps} min={0} /></LabField>
        <LabField label="Book value per share" id="gn-bv"><LabNumberInput id="gn-bv" value={bvps} onChange={setBvps} min={0} /></LabField>
      </div>
      {result != null && result > 0 && (
        <div className="mt-6"><LabResultTile label="Graham Number" value={fmt(result)} /></div>
      )}
    </div>
  );
}

export function PegRatioAnalyzer() {
  const [pe, setPe] = useState("15");
  const [growth, setGrowth] = useState("12");

  const result = useMemo(() => {
    const p = parseFloat(pe);
    const g = parseFloat(growth);
    if (!p || !g) return null;
    return pegRatio(p, g);
  }, [pe, growth]);

  const verdictLabel = { undervalued: "Undervalued", fair: "Fair valued", overvalued: "Overvalued" };

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="P/E ratio" id="peg-pe"><LabNumberInput id="peg-pe" value={pe} onChange={setPe} min={0} /></LabField>
        <LabField label="Earnings growth" id="peg-g" suffix="%"><LabNumberInput id="peg-g" value={growth} onChange={setGrowth} /></LabField>
      </div>
      {result && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <LabResultTile label="PEG ratio" value={fmt(result.peg)} />
          <LabResultTile label="Verdict" value={verdictLabel[result.verdict]}
            tone={result.verdict === "undervalued" ? "positive" : result.verdict === "overvalued" ? "negative" : "neutral"} />
        </div>
      )}
    </div>
  );
}

export function RoeRoicProjector() {
  const [margin, setMargin] = useState("10");
  const [turnover, setTurnover] = useState("1.2");
  const [leverage, setLeverage] = useState("2");
  const [years, setYears] = useState("5");

  const current = useMemo(() => duPontRoe({
    netProfitMargin: parseFloat(margin) || 0,
    assetTurnover: parseFloat(turnover) || 0,
    equityMultiplier: parseFloat(leverage) || 0,
  }), [margin, turnover, leverage]);

  const projection = useMemo(() => projectRoe({
    currentRoe: current.roe,
    marginChange: 0.5,
    turnoverChange: 0.1,
    leverageChange: 0,
    years: parseInt(years) || 5,
  }), [current.roe, years]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LabField label="Net margin" id="roe-m" suffix="%"><LabNumberInput id="roe-m" value={margin} onChange={setMargin} /></LabField>
        <LabField label="Asset turnover" id="roe-t"><LabNumberInput id="roe-t" value={turnover} onChange={setTurnover} /></LabField>
        <LabField label="Equity multiplier" id="roe-l"><LabNumberInput id="roe-l" value={leverage} onChange={setLeverage} /></LabField>
        <LabField label="Proyeksi (tahun)" id="roe-y"><LabNumberInput id="roe-y" value={years} onChange={setYears} min={1} max={10} /></LabField>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <LabResultTile label="ROE (DuPont)" value={`${fmt(current.roe)}%`} />
        <LabResultTile label="ROIC" value={`${fmt(current.roic)}%`} />
      </div>
      {projection.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {projection.map((roe, i) => (
            <span key={i} className="rounded-lg border border-border px-3 py-1.5 text-sm">
              Y{i + 1}: {fmt(roe)}%
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function EarningsGrowthProjector() {
  const [eps, setEps] = useState("500");
  const [revGrowth, setRevGrowth] = useState("10");
  const [marginImp, setMarginImp] = useState("0.5");
  const [shareChange, setShareChange] = useState("0");
  const [years, setYears] = useState("5");

  const projection = useMemo(() => projectEarnings({
    currentEps: parseFloat(eps) || 0,
    revenueGrowth: parseFloat(revGrowth) || 0,
    marginImprovement: parseFloat(marginImp) || 0,
    shareChange: parseFloat(shareChange) || 0,
    years: parseInt(years) || 5,
  }), [eps, revGrowth, marginImp, shareChange, years]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LabField label="EPS saat ini" id="eg-eps"><LabNumberInput id="eg-eps" value={eps} onChange={setEps} min={0} /></LabField>
        <LabField label="Revenue growth" id="eg-rev" suffix="%"><LabNumberInput id="eg-rev" value={revGrowth} onChange={setRevGrowth} /></LabField>
        <LabField label="Margin improvement" id="eg-mar" suffix="%/yr"><LabNumberInput id="eg-mar" value={marginImp} onChange={setMarginImp} /></LabField>
        <LabField label="Share change" id="eg-sh" suffix="%/yr"><LabNumberInput id="eg-sh" value={shareChange} onChange={setShareChange} /></LabField>
        <LabField label="Tahun proyeksi" id="eg-y"><LabNumberInput id="eg-y" value={years} onChange={setYears} min={1} max={10} /></LabField>
      </div>
      {projection.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-4">Tahun</th><th className="py-2 pr-4">EPS</th><th className="py-2">Growth</th>
            </tr></thead>
            <tbody>
              {projection.map((p) => (
                <tr key={p.year} className="border-b border-border/40">
                  <td className="py-2 pr-4">{p.year}</td>
                  <td className="py-2 pr-4">{fmt(p.eps)}</td>
                  <td className="py-2 text-profit">{fmt(p.growth)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

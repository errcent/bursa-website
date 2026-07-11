"use client";

import { useMemo, useState } from "react";

import { LabField, LabNumberInput, LabResultTile } from "@/components/lab/lab-field";
import {
  breakevenWinRate,
  generateEquityCurve,
  ruinProbability,
  tradeExpectancy,
  tradeSequence,
  winRateScenarios,
} from "@/lib/lab/performance";

function fmt(n: number, d = 2): string {
  return n.toLocaleString("id-ID", { maximumFractionDigits: d });
}

export function TradeExpectancyCalculator() {
  const [winRate, setWinRate] = useState("55");
  const [rr, setRr] = useState("2");
  const [risk, setRisk] = useState("1000000");
  const [trades, setTrades] = useState("100");

  const result = useMemo(() => {
    const wr = parseFloat(winRate);
    const r = parseFloat(rr);
    const rk = parseFloat(risk);
    const t = parseInt(trades);
    if (!wr || !r || !rk || !t) return null;
    return tradeExpectancy({ winRate: wr, riskRewardRatio: r, riskPerTrade: rk, numTrades: t });
  }, [winRate, rr, risk, trades]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Win rate" id="te-wr" suffix="%"><LabNumberInput id="te-wr" value={winRate} onChange={setWinRate} min={0} max={100} /></LabField>
        <LabField label="R:R ratio" id="te-rr"><LabNumberInput id="te-rr" value={rr} onChange={setRr} min={0} /></LabField>
        <LabField label="Risiko per trade" id="te-risk" suffix="Rp"><LabNumberInput id="te-risk" value={risk} onChange={setRisk} min={0} /></LabField>
        <LabField label="Jumlah trade" id="te-trades"><LabNumberInput id="te-trades" value={trades} onChange={setTrades} min={1} /></LabField>
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
  );
}

export function WinRateScenarioAnalyzer() {
  const [target, setTarget] = useState("20");
  const [risk, setRisk] = useState("1");
  const [trades, setTrades] = useState("100");

  const scenarios = useMemo(() => {
    const t = parseFloat(target);
    const r = parseFloat(risk);
    const n = parseInt(trades);
    if (!t || !r || !n) return [];
    return winRateScenarios(t, r, n).slice(0, 12);
  }, [target, risk, trades]);

  const beWr = useMemo(() => breakevenWinRate(parseFloat("2") || 2), []);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <LabField label="Target return (%)" id="ws-target" suffix="%"><LabNumberInput id="ws-target" value={target} onChange={setTarget} /></LabField>
        <LabField label="Risiko per trade" id="ws-risk" suffix="%"><LabNumberInput id="ws-risk" value={risk} onChange={setRisk} min={0} /></LabField>
        <LabField label="Jumlah trade" id="ws-trades"><LabNumberInput id="ws-trades" value={trades} onChange={setTrades} min={1} /></LabField>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Breakeven win rate @ 2R: {fmt(beWr)}%</p>
      {scenarios.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-4">Win Rate</th><th className="py-2 pr-4">R:R</th><th className="py-2">Expectancy</th>
            </tr></thead>
            <tbody>
              {scenarios.map((s, i) => (
                <tr key={i} className="border-b border-border/40">
                  <td className="py-2 pr-4">{s.winRate}%</td>
                  <td className="py-2 pr-4">1:{s.riskReward}</td>
                  <td className={`py-2 ${s.expectancy > 0 ? "text-profit" : "text-loss"}`}>{fmt(s.expectancy)}R</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function RuinProbabilityCalculator() {
  const [winRate, setWinRate] = useState("55");
  const [rr, setRr] = useState("2");
  const [risk, setRisk] = useState("1000000");
  const [capital, setCapital] = useState("100000000");

  const result = useMemo(() => {
    const wr = parseFloat(winRate);
    const r = parseFloat(rr);
    const rk = parseFloat(risk);
    const c = parseFloat(capital);
    if (!wr || !r || !rk || !c) return null;
    return ruinProbability({ winRate: wr, riskRewardRatio: r, riskPerTrade: rk, startingCapital: c });
  }, [winRate, rr, risk, capital]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Win rate" id="rp-wr" suffix="%"><LabNumberInput id="rp-wr" value={winRate} onChange={setWinRate} min={0} max={100} /></LabField>
        <LabField label="R:R ratio" id="rp-rr"><LabNumberInput id="rp-rr" value={rr} onChange={setRr} min={0} /></LabField>
        <LabField label="Risiko per trade" id="rp-risk" suffix="Rp"><LabNumberInput id="rp-risk" value={risk} onChange={setRisk} min={0} /></LabField>
        <LabField label="Modal awal" id="rp-cap" suffix="Rp"><LabNumberInput id="rp-cap" value={capital} onChange={setCapital} min={0} /></LabField>
      </div>
      {result != null && (
        <div className="mt-6">
          <LabResultTile label="Probabilitas ruin" value={`${fmt(Math.min(result, 100))}%`}
            tone={result > 10 ? "negative" : result > 1 ? "neutral" : "positive"} />
        </div>
      )}
    </div>
  );
}

export function EquityCurveSimulator() {
  const [capital, setCapital] = useState("100000000");
  const [winRate, setWinRate] = useState("55");
  const [rr, setRr] = useState("2");
  const [risk, setRisk] = useState("1");
  const [trades, setTrades] = useState("50");
  const [curve, setCurve] = useState<ReturnType<typeof generateEquityCurve>>([]);

  const run = () => {
    setCurve(generateEquityCurve({
      startingCapital: parseFloat(capital) || 0,
      winRate: parseFloat(winRate) || 0,
      riskRewardRatio: parseFloat(rr) || 0,
      riskPerTrade: parseFloat(risk) || 0,
      numTrades: parseInt(trades) || 0,
    }));
  };

  const finalEquity = curve.length > 0 ? curve[curve.length - 1].equity : 0;
  const maxDd = curve.length > 0 ? Math.max(...curve.map((c) => c.drawdown)) : 0;

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LabField label="Modal awal" id="ec-cap" suffix="Rp"><LabNumberInput id="ec-cap" value={capital} onChange={setCapital} min={0} /></LabField>
        <LabField label="Win rate" id="ec-wr" suffix="%"><LabNumberInput id="ec-wr" value={winRate} onChange={setWinRate} min={0} max={100} /></LabField>
        <LabField label="R:R" id="ec-rr"><LabNumberInput id="ec-rr" value={rr} onChange={setRr} min={0} /></LabField>
        <LabField label="Risiko/trade" id="ec-risk" suffix="%"><LabNumberInput id="ec-risk" value={risk} onChange={setRisk} min={0} /></LabField>
        <LabField label="Jumlah trade" id="ec-trades"><LabNumberInput id="ec-trades" value={trades} onChange={setTrades} min={1} max={500} /></LabField>
      </div>
      <button type="button" onClick={run} className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">Simulasikan</button>
      {curve.length > 0 && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <LabResultTile label="Ekuitas akhir" value={`Rp ${fmt(finalEquity, 0)}`} tone={finalEquity > parseFloat(capital) ? "positive" : "negative"} />
            <LabResultTile label="Max drawdown" value={`${fmt(maxDd)}%`} tone="negative" />
          </div>
          <div className="mt-4 flex h-32 items-end gap-px">
            {curve.map((c, i) => {
              const start = parseFloat(capital) || 1;
              const h = Math.max(2, (c.equity / start) * 40);
              return <div key={i} className={`flex-1 rounded-t ${c.equity >= start ? "bg-profit/60" : "bg-loss/60"}`} style={{ height: `${Math.min(h, 128)}px` }} title={`Trade ${c.trade}: Rp ${fmt(c.equity, 0)}`} />;
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function TradeSequenceSimulator() {
  const [trades, setTrades] = useState("30");
  const [winRate, setWinRate] = useState("55");
  const [rr, setRr] = useState("2");
  const [sequence, setSequence] = useState<ReturnType<typeof tradeSequence>>([]);

  const run = () => {
    setSequence(tradeSequence({
      numTrades: parseInt(trades) || 0,
      winRate: parseFloat(winRate) || 0,
      riskRewardRatio: parseFloat(rr) || 0,
    }));
  };

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <LabField label="Jumlah trade" id="ts-trades"><LabNumberInput id="ts-trades" value={trades} onChange={setTrades} min={1} max={200} /></LabField>
        <LabField label="Win rate" id="ts-wr" suffix="%"><LabNumberInput id="ts-wr" value={winRate} onChange={setWinRate} min={0} max={100} /></LabField>
        <LabField label="R:R" id="ts-rr"><LabNumberInput id="ts-rr" value={rr} onChange={setRr} min={0} /></LabField>
      </div>
      <button type="button" onClick={run} className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">Generate sequence</button>
      {sequence.length > 0 && (
        <>
          <div className="mt-4">
            <LabResultTile label="Total R" value={`${fmt(sequence[sequence.length - 1].cumulative)}R`}
              tone={sequence[sequence.length - 1].cumulative > 0 ? "positive" : "negative"} />
          </div>
          <div className="mt-4 flex flex-wrap gap-1">
            {sequence.map((s) => (
              <span key={s.trade} className={`inline-flex size-7 items-center justify-center rounded text-xs font-medium ${s.result === "win" ? "bg-profit/20 text-profit" : "bg-loss/20 text-loss"}`}
                title={`Trade ${s.trade}: ${s.rMultiple}R`}>
                {s.result === "win" ? "W" : "L"}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

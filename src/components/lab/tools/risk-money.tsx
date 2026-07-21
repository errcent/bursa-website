"use client";

import { useMemo, useState } from "react";

import {
  LabDirectionToggle,
  LabField,
  LabNumberInput,
  LabResultGrid,
  LabResultTile,
  LabToolPanel,
} from "@/components/lab/lab-field";
import {
  breakevenPrice,
  kellyVariants,
  positionSize,
  riskReward,
} from "@/lib/lab/risk-management";

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString("id-ID", { maximumFractionDigits: decimals });
}

export function PositionSizeCalculator() {
  const [balance, setBalance] = useState("100000000");
  const [riskPct, setRiskPct] = useState("1");
  const [entry, setEntry] = useState("5000");
  const [stopLoss, setStopLoss] = useState("4800");

  const result = useMemo(() => {
    const b = parseFloat(balance);
    const r = parseFloat(riskPct);
    const e = parseFloat(entry);
    const sl = parseFloat(stopLoss);
    if (!b || !r || !e || !sl) return null;
    return positionSize({ accountBalance: b, riskPercent: r, entryPrice: e, stopLossPrice: sl });
  }, [balance, riskPct, entry, stopLoss]);

  return (
    <LabToolPanel
      title="Parameter posisi"
      description="Masukkan modal, persentase risiko, entry, dan stop loss untuk menghitung ukuran posisi optimal."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Modal / saldo akun" id="ps-balance" suffix="Rp">
          <LabNumberInput id="ps-balance" value={balance} onChange={setBalance} min={0} />
        </LabField>
        <LabField label="Risiko per trade" id="ps-risk" suffix="%" helperText="Umumnya 0,5–2% per trade">
          <LabNumberInput id="ps-risk" value={riskPct} onChange={setRiskPct} min={0} max={100} />
        </LabField>
        <LabField label="Harga entry" id="ps-entry">
          <LabNumberInput id="ps-entry" value={entry} onChange={setEntry} min={0} />
        </LabField>
        <LabField label="Harga stop loss" id="ps-sl">
          <LabNumberInput id="ps-sl" value={stopLoss} onChange={setStopLoss} min={0} />
        </LabField>
      </div>
      {result && (
        <LabResultGrid>
          <LabResultTile label="Jumlah risiko" value={`Rp ${fmt(result.riskAmount, 0)}`} tone="negative" />
          <LabResultTile label="Jumlah lot/lembar" value={fmt(result.shares, 0)} />
          <LabResultTile label="Nilai posisi" value={`Rp ${fmt(result.positionValue, 0)}`} />
          <LabResultTile label="Risiko per lembar" value={fmt(result.riskPerShare)} />
        </LabResultGrid>
      )}
    </LabToolPanel>
  );
}

export function RiskRewardCalculator() {
  const [entry, setEntry] = useState("5000");
  const [sl, setSl] = useState("4800");
  const [tp, setTp] = useState("5500");
  const [size, setSize] = useState("100");

  const result = useMemo(() => {
    const e = parseFloat(entry);
    const s = parseFloat(sl);
    const t = parseFloat(tp);
    const sz = parseFloat(size);
    if (!e || !s || !t) return null;
    return riskReward({ entryPrice: e, stopLossPrice: s, takeProfitPrice: t, positionSize: sz || 1 });
  }, [entry, sl, tp, size]);

  return (
    <LabToolPanel title="Rasio risk-reward" description="Validasi apakah potensi reward sebanding dengan risiko yang diambil.">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Harga entry" id="rr-entry"><LabNumberInput id="rr-entry" value={entry} onChange={setEntry} min={0} /></LabField>
        <LabField label="Stop loss" id="rr-sl"><LabNumberInput id="rr-sl" value={sl} onChange={setSl} min={0} /></LabField>
        <LabField label="Take profit" id="rr-tp"><LabNumberInput id="rr-tp" value={tp} onChange={setTp} min={0} /></LabField>
        <LabField label="Ukuran posisi (lembar)" id="rr-size"><LabNumberInput id="rr-size" value={size} onChange={setSize} min={0} /></LabField>
      </div>
      {result && (
        <LabResultGrid>
          <LabResultTile label="R:R Ratio" value={`1 : ${fmt(result.ratio)}`} tone={result.ratio >= 2 ? "positive" : "neutral"} />
          <LabResultTile label="Potensi rugi" value={fmt(result.riskAmount)} tone="negative" />
          <LabResultTile label="Potensi untung" value={fmt(result.rewardAmount)} tone="positive" />
          <LabResultTile label="Risk %" value={`${fmt(result.riskPercent)}%`} />
        </LabResultGrid>
      )}
    </LabToolPanel>
  );
}

export function BreakevenCalculator() {
  const [entry, setEntry] = useState("5000");
  const [qty, setQty] = useState("100");
  const [commBuy, setCommBuy] = useState("5000");
  const [commSell, setCommSell] = useState("5000");
  const [spread, setSpread] = useState("0");
  const [tax, setTax] = useState("0");
  const [direction, setDirection] = useState<"long" | "short">("long");

  const result = useMemo(() => {
    const e = parseFloat(entry);
    const q = parseFloat(qty);
    if (!e || !q) return null;
    return breakevenPrice({
      entryPrice: e, quantity: q,
      commissionBuy: parseFloat(commBuy) || 0,
      commissionSell: parseFloat(commSell) || 0,
      spreadCost: parseFloat(spread) || 0,
      taxRate: parseFloat(tax) || 0,
      direction,
    });
  }, [entry, qty, commBuy, commSell, spread, tax, direction]);

  return (
    <LabToolPanel title="Harga impas setelah biaya" description="Sertakan komisi, spread, dan pajak untuk mendapatkan breakeven yang realistis.">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Harga entry" id="be-entry"><LabNumberInput id="be-entry" value={entry} onChange={setEntry} min={0} /></LabField>
        <LabField label="Jumlah lembar" id="be-qty"><LabNumberInput id="be-qty" value={qty} onChange={setQty} min={0} /></LabField>
        <LabField label="Komisi beli" id="be-cb" suffix="Rp"><LabNumberInput id="be-cb" value={commBuy} onChange={setCommBuy} min={0} /></LabField>
        <LabField label="Komisi jual" id="be-cs" suffix="Rp"><LabNumberInput id="be-cs" value={commSell} onChange={setCommSell} min={0} /></LabField>
        <LabField label="Biaya spread" id="be-sp" suffix="Rp"><LabNumberInput id="be-sp" value={spread} onChange={setSpread} min={0} /></LabField>
        <LabField label="Pajak (%)" id="be-tax"><LabNumberInput id="be-tax" value={tax} onChange={setTax} min={0} /></LabField>
      </div>
      <div className="mt-4">
        <LabDirectionToggle value={direction} onChange={setDirection} />
      </div>
      {result != null && (
        <LabResultGrid className="sm:grid-cols-1 lg:grid-cols-2">
          <LabResultTile label="Harga breakeven" value={fmt(result)} />
        </LabResultGrid>
      )}
    </LabToolPanel>
  );
}

export function KellyCriterionCalculator() {
  const [winRate, setWinRate] = useState("55");
  const [rr, setRr] = useState("2");

  const result = useMemo(() => {
    const wr = parseFloat(winRate);
    const r = parseFloat(rr);
    if (!wr || !r) return null;
    return kellyVariants(wr, r);
  }, [winRate, rr]);

  return (
    <LabToolPanel title="Fraksi Kelly" description="Full Kelly sering terlalu agresif — half dan quarter Kelly lebih umum dipakai praktisi.">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Win rate" id="kelly-wr" suffix="%"><LabNumberInput id="kelly-wr" value={winRate} onChange={setWinRate} min={0} max={100} /></LabField>
        <LabField label="R:R ratio" id="kelly-rr"><LabNumberInput id="kelly-rr" value={rr} onChange={setRr} min={0} /></LabField>
      </div>
      {result && (
        <LabResultGrid className="lg:grid-cols-3">
          <LabResultTile label="Full Kelly" value={`${fmt(result.full * 100)}%`} tone={result.full > 0 ? "positive" : "negative"} />
          <LabResultTile label="Half Kelly" value={`${fmt(result.half * 100)}%`} />
          <LabResultTile label="Quarter Kelly" value={`${fmt(result.quarter * 100)}%`} />
        </LabResultGrid>
      )}
    </LabToolPanel>
  );
}

"use client";

import { useMemo, useState } from "react";

import { LabField, LabNumberInput, LabResultTile } from "@/components/lab/lab-field";
import {
  commissionSlippageImpact,
  cryptoFees,
  lotConversions,
  marginRequired,
  pipValue,
  swapFee,
} from "@/lib/lab/trading-mechanics";

function fmt(n: number, d = 2): string {
  return n.toLocaleString("id-ID", { maximumFractionDigits: d });
}

export function PipValueCalculator() {
  const [pipSize, setPipSize] = useState("0.0001");
  const [lots, setLots] = useState("1");
  const [contract, setContract] = useState("100000");
  const [rate, setRate] = useState("1");

  const result = useMemo(() => pipValue({
    pipSize: parseFloat(pipSize) || 0,
    lotSize: parseFloat(lots) || 0,
    contractSize: parseFloat(contract) || 0,
    exchangeRate: parseFloat(rate) || 1,
  }), [pipSize, lots, contract, rate]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Pip size" id="pv-ps"><LabNumberInput id="pv-ps" value={pipSize} onChange={setPipSize} /></LabField>
        <LabField label="Lot size" id="pv-lot"><LabNumberInput id="pv-lot" value={lots} onChange={setLots} min={0} /></LabField>
        <LabField label="Contract size" id="pv-con"><LabNumberInput id="pv-con" value={contract} onChange={setContract} min={0} /></LabField>
        <LabField label="Exchange rate" id="pv-rate"><LabNumberInput id="pv-rate" value={rate} onChange={setRate} min={0} /></LabField>
      </div>
      <div className="mt-6"><LabResultTile label="Nilai per pip" value={`$${fmt(result)}`} /></div>
    </div>
  );
}

export function LotSizeCalculator() {
  const [standard, setStandard] = useState("1");

  const result = useMemo(() => lotConversions(parseFloat(standard) || 0), [standard]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <LabField label="Standard lots" id="ls-std"><LabNumberInput id="ls-std" value={standard} onChange={setStandard} min={0} step={0.01} /></LabField>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <LabResultTile label="Standard" value={fmt(result.standard)} />
        <LabResultTile label="Mini" value={fmt(result.mini)} />
        <LabResultTile label="Micro" value={fmt(result.micro)} />
        <LabResultTile label="Units" value={fmt(result.units, 0)} />
      </div>
    </div>
  );
}

export function MarginLeverageCalculator() {
  const [value, setValue] = useState("10000");
  const [leverage, setLeverage] = useState("100");

  const result = useMemo(() => marginRequired({
    positionValue: parseFloat(value) || 0,
    leverage: parseFloat(leverage) || 0,
  }), [value, leverage]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Nilai posisi" id="ml-val" suffix="$"><LabNumberInput id="ml-val" value={value} onChange={setValue} min={0} /></LabField>
        <LabField label="Leverage" id="ml-lev" suffix="x"><LabNumberInput id="ml-lev" value={leverage} onChange={setLeverage} min={1} /></LabField>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <LabResultTile label="Margin required" value={`$${fmt(result.margin)}`} />
        <LabResultTile label="Buying power" value={`$${fmt(result.buyingPower)}`} />
      </div>
    </div>
  );
}

export function SwapRolloverCalculator() {
  const [lots, setLots] = useState("1");
  const [rate, setRate] = useState("0.5");
  const [nights, setNights] = useState("1");

  const result = useMemo(() => swapFee({
    lotSize: parseFloat(lots) || 0,
    swapRate: parseFloat(rate) || 0,
    nights: parseInt(nights) || 0,
  }), [lots, rate, nights]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <LabField label="Lot size" id="sw-lot"><LabNumberInput id="sw-lot" value={lots} onChange={setLots} min={0} /></LabField>
        <LabField label="Swap rate (per lot)" id="sw-rate"><LabNumberInput id="sw-rate" value={rate} onChange={setRate} /></LabField>
        <LabField label="Malam (nights)" id="sw-n"><LabNumberInput id="sw-n" value={nights} onChange={setNights} min={0} /></LabField>
      </div>
      <div className="mt-6"><LabResultTile label="Total swap fee" value={`$${fmt(result)}`} tone={result < 0 ? "negative" : "positive"} /></div>
    </div>
  );
}

export function CommissionSlippageCalculator() {
  const [winRate, setWinRate] = useState("55");
  const [rr, setRr] = useState("2");
  const [commission, setCommission] = useState("50000");
  const [slippage, setSlippage] = useState("10000");
  const [risk, setRisk] = useState("1000000");

  const result = useMemo(() => commissionSlippageImpact({
    winRate: parseFloat(winRate) || 0,
    riskRewardRatio: parseFloat(rr) || 0,
    commissionPerTrade: parseFloat(commission) || 0,
    slippagePerTrade: parseFloat(slippage) || 0,
    riskPerTrade: parseFloat(risk) || 0,
  }), [winRate, rr, commission, slippage, risk]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Win rate" id="cs-wr" suffix="%"><LabNumberInput id="cs-wr" value={winRate} onChange={setWinRate} min={0} max={100} /></LabField>
        <LabField label="R:R" id="cs-rr"><LabNumberInput id="cs-rr" value={rr} onChange={setRr} min={0} /></LabField>
        <LabField label="Komisi/trade" id="cs-comm" suffix="Rp"><LabNumberInput id="cs-comm" value={commission} onChange={setCommission} min={0} /></LabField>
        <LabField label="Slippage/trade" id="cs-slip" suffix="Rp"><LabNumberInput id="cs-slip" value={slippage} onChange={setSlippage} min={0} /></LabField>
        <LabField label="Risiko/trade" id="cs-risk" suffix="Rp"><LabNumberInput id="cs-risk" value={risk} onChange={setRisk} min={0} /></LabField>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <LabResultTile label="Adjusted expectancy" value={`${fmt(result.adjustedExpectancy)}R`} tone={result.adjustedExpectancy > 0 ? "positive" : "negative"} />
        <LabResultTile label="Breakeven win rate" value={`${fmt(result.breakevenWinRate)}%`} />
        <LabResultTile label="Cost/trade" value={`Rp ${fmt(result.costPerTrade, 0)}`} />
        <LabResultTile label="Annual cost (252d)" value={`Rp ${fmt(result.annualCost, 0)}`} tone="negative" />
      </div>
    </div>
  );
}

export function CryptoFeeCalculator() {
  const [value, setValue] = useState("10000");
  const [maker, setMaker] = useState("0.02");
  const [taker, setTaker] = useState("0.05");
  const [funding, setFunding] = useState("0.01");
  const [hours, setHours] = useState("24");

  const result = useMemo(() => cryptoFees({
    positionValue: parseFloat(value) || 0,
    makerFee: parseFloat(maker) || 0,
    takerFee: parseFloat(taker) || 0,
    fundingRate: parseFloat(funding) || 0,
    holdingHours: parseFloat(hours) || 0,
  }), [value, maker, taker, funding, hours]);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LabField label="Nilai posisi" id="cf-val" suffix="$"><LabNumberInput id="cf-val" value={value} onChange={setValue} min={0} /></LabField>
        <LabField label="Maker fee" id="cf-m" suffix="%"><LabNumberInput id="cf-m" value={maker} onChange={setMaker} min={0} /></LabField>
        <LabField label="Taker fee" id="cf-t" suffix="%"><LabNumberInput id="cf-t" value={taker} onChange={setTaker} min={0} /></LabField>
        <LabField label="Funding rate (8h)" id="cf-f" suffix="%"><LabNumberInput id="cf-f" value={funding} onChange={setFunding} /></LabField>
        <LabField label="Holding hours" id="cf-h"><LabNumberInput id="cf-h" value={hours} onChange={setHours} min={0} /></LabField>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <LabResultTile label="Entry fee" value={`$${fmt(result.entryFee)}`} />
        <LabResultTile label="Exit fee" value={`$${fmt(result.exitFee)}`} />
        <LabResultTile label="Funding cost" value={`$${fmt(result.fundingCost)}`} />
        <LabResultTile label="Total cost" value={`$${fmt(result.totalCost)}`} tone="negative" />
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { LabCalculatorShell, LabOutputPanel } from "@/components/lab/lab-calculator-shell";
import {
  LabCopyResults,
  LabDirectionToggle,
  LabField,
  LabInterpretation,
  LabMarketSelect,
  LabNumberInput,
  LabPresetBar,
  LabResultGrid,
  LabResultTile,
  LabToolPanel,
} from "@/components/lab/lab-field";
import type { LabMarket } from "@/lib/lab/markets";
import {
  breakevenPrice,
  kellyVariants,
  positionSize,
  riskReward,
} from "@/lib/lab/risk-management";

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString("id-ID", { maximumFractionDigits: decimals });
}

const LOT_SIZE: Record<LabMarket, number> = {
  idx: 100,
  forex: 100000,
  crypto: 1,
};

const UNIT_LABEL: Record<LabMarket, string> = {
  idx: "lembar",
  forex: "unit",
  crypto: "kontrak",
};

const CURRENCY: Record<LabMarket, { suffix: string; symbol: string; label: string }> = {
  idx: { suffix: "Rp", symbol: "Rp", label: "IDR" },
  forex: { suffix: "USD", symbol: "$", label: "USD" },
  crypto: { suffix: "USDT", symbol: "USDT", label: "USDT" },
};

function formatMoney(value: number, market: LabMarket, decimals = 0): string {
  const c = CURRENCY[market];
  if (market === "forex") {
    return `${c.symbol}${value.toLocaleString("en-US", { maximumFractionDigits: decimals })}`;
  }
  return `${c.symbol} ${fmt(value, decimals)}`;
}

export function PositionSizeCalculator() {
  const [market, setMarket] = useState<LabMarket>("idx");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [balance, setBalance] = useState("100000000");
  const [riskPct, setRiskPct] = useState("1");
  const [entry, setEntry] = useState("5000");
  const [stopLoss, setStopLoss] = useState("4800");
  const [activePreset, setActivePreset] = useState<string>();

  const currency = CURRENCY[market];

  const result = useMemo(() => {
    const b = parseFloat(balance);
    const r = parseFloat(riskPct);
    const e = parseFloat(entry);
    const sl = parseFloat(stopLoss);
    if (!b || !r || !e || !sl || e === sl) return null;
    const raw = positionSize({ accountBalance: b, riskPercent: r, entryPrice: e, stopLossPrice: sl });
    const units = raw.shares;
    const lots =
      market === "idx"
        ? units / LOT_SIZE.idx
        : market === "forex"
          ? units / LOT_SIZE.forex
          : units;
    return { ...raw, units, lots, lotLabel: market === "idx" ? "lot" : market === "forex" ? "lot" : "unit" };
  }, [balance, riskPct, entry, stopLoss, market]);

  const slInvalid = useMemo(() => {
    const e = parseFloat(entry);
    const sl = parseFloat(stopLoss);
    if (!e || !sl) return false;
    return direction === "long" ? sl >= e : sl <= e;
  }, [entry, stopLoss, direction]);

  const slHelperText = slInvalid
    ? direction === "long"
      ? "SL harus di bawah entry (long)"
      : "SL harus di atas entry (short)"
    : undefined;

  const copyText = result
    ? [
        `Ukuran Posisi (${market.toUpperCase()} · ${direction})`,
        `Risiko: ${formatMoney(result.riskAmount, market, 0)} (${riskPct}%)`,
        `Posisi: ${fmt(result.lots, market === "forex" ? 2 : 2)} ${result.lotLabel} (${fmt(result.units, 0)} ${UNIT_LABEL[market]})`,
        `Nilai posisi: ${formatMoney(result.positionValue, market, 0)}`,
        "Edukasi — bukan saran investasi.",
      ].join("\n")
    : "";

  return (
    <LabCalculatorShell
      input={
        <LabToolPanel description="Modal, risiko, entry, dan stop loss.">
          <div className="flex flex-col gap-5">
            <LabMarketSelect value={market} onChange={setMarket} />
            <LabPresetBar
              label="Skenario"
              activeId={activePreset}
              presets={[
                { id: "idx-conservative", label: "IDX konservatif" },
                { id: "idx-active", label: "IDX aktif" },
                { id: "forex-scalp", label: "Forex scalp" },
              ]}
              onSelect={(id) => {
                setActivePreset(id);
                setDirection("long");
                if (id === "idx-conservative") {
                  setMarket("idx");
                  setBalance("50000000");
                  setRiskPct("0.5");
                  setEntry("5000");
                  setStopLoss("4900");
                } else if (id === "idx-active") {
                  setMarket("idx");
                  setBalance("100000000");
                  setRiskPct("1");
                  setEntry("5000");
                  setStopLoss("4800");
                } else {
                  setMarket("forex");
                  setBalance("10000");
                  setRiskPct("1");
                  setEntry("1.0850");
                  setStopLoss("1.0830");
                }
              }}
            />
            <LabDirectionToggle value={direction} onChange={setDirection} />
            <div className="grid gap-4 sm:grid-cols-2">
              <LabField label="Modal / saldo akun" id="ps-balance" suffix={currency.suffix}>
                <LabNumberInput id="ps-balance" value={balance} onChange={setBalance} min={0} />
              </LabField>
              <LabField label="Risiko per trade" id="ps-risk" suffix="%" helperText="Umumnya 0,5–2%">
                <LabNumberInput id="ps-risk" value={riskPct} onChange={setRiskPct} min={0} max={100} />
              </LabField>
              <LabField label="Harga entry" id="ps-entry">
                <LabNumberInput id="ps-entry" value={entry} onChange={setEntry} min={0} />
              </LabField>
              <LabField label="Harga stop loss" id="ps-sl" helperText={slHelperText}>
                <LabNumberInput id="ps-sl" value={stopLoss} onChange={setStopLoss} min={0} />
              </LabField>
            </div>
          </div>
        </LabToolPanel>
      }
      output={
        <LabOutputPanel
          footer={<LabCopyResults text={copyText} />}
        >
          {!result ? (
            <LabInterpretation>Isi parameter untuk melihat ukuran posisi.</LabInterpretation>
          ) : (
            <div className="flex flex-col gap-4">
              <LabInterpretation
                tone={parseFloat(riskPct) > 2 ? "warning" : "neutral"}
              >
                {parseFloat(riskPct) > 2
                  ? "Risiko di atas 2% per trade — umumnya dianggap agresif untuk kebanyakan trader."
                  : market === "idx"
                    ? `Untuk IDX, 1 lot = 100 lembar. Posisi ${fmt(result.lots, 2)} lot = ${fmt(result.units, 0)} lembar.`
                    : market === "forex"
                      ? `Perhitungan inti sama; label lot disesuaikan (${fmt(result.lots, 2)} standard lot). Konfirmasi unit & margin dengan broker — bukan per pip.`
                      : `Perhitungan inti sama; label kontrak disesuaikan. Konfirmasi ukuran kontrak dengan exchange.`}
              </LabInterpretation>
              <LabResultGrid className="mt-0 grid-cols-1 gap-2 sm:grid-cols-1">
                <LabResultTile label="Jumlah risiko" value={formatMoney(result.riskAmount, market, 0)} tone="negative" />
                <LabResultTile
                  label={market === "idx" ? "Lot (100 lembar)" : "Lot / unit"}
                  value={`${fmt(result.lots, market === "forex" ? 2 : 2)} ${result.lotLabel}`}
                />
                <LabResultTile label={`${UNIT_LABEL[market]} total`} value={fmt(result.units, 0)} />
                <LabResultTile label="Nilai posisi" value={formatMoney(result.positionValue, market, 0)} />
              </LabResultGrid>
              <Link href="/lab/risk-reward" className="text-xs font-medium text-accent hover:underline">
                Lanjut ke Risk-Reward →
              </Link>
            </div>
          )}
        </LabOutputPanel>
      }
    />
  );
}

export function RiskRewardCalculator() {
  const [entry, setEntry] = useState("5000");
  const [sl, setSl] = useState("4800");
  const [tp, setTp] = useState("5500");
  const [size, setSize] = useState("100");
  const [activePreset, setActivePreset] = useState<string>();

  const result = useMemo(() => {
    const e = parseFloat(entry);
    const s = parseFloat(sl);
    const t = parseFloat(tp);
    const sz = parseFloat(size);
    if (!e || !s || !t) return null;
    return riskReward({ entryPrice: e, stopLossPrice: s, takeProfitPrice: t, positionSize: sz || 1 });
  }, [entry, sl, tp, size]);

  const copyText = result
    ? `Risk-Reward\nR:R = 1:${fmt(result.ratio)}\nRugi: ${fmt(result.riskAmount)}\nUntung: ${fmt(result.rewardAmount)}`
    : "";

  return (
    <LabCalculatorShell
      input={
        <LabToolPanel description="Entry, stop loss, take profit, dan ukuran posisi.">
          <div className="flex flex-col gap-5">
            <LabPresetBar
              activeId={activePreset}
              presets={[
                { id: "rr-2", label: "R:R 1:2" },
                { id: "rr-3", label: "R:R 1:3" },
              ]}
              onSelect={(id) => {
                setActivePreset(id);
                setEntry("5000");
                setSl("4800");
                setTp(id === "rr-3" ? "5600" : "5400");
                setSize("100");
              }}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <LabField label="Harga entry" id="rr-entry"><LabNumberInput id="rr-entry" value={entry} onChange={setEntry} min={0} /></LabField>
              <LabField label="Stop loss" id="rr-sl"><LabNumberInput id="rr-sl" value={sl} onChange={setSl} min={0} /></LabField>
              <LabField label="Take profit" id="rr-tp"><LabNumberInput id="rr-tp" value={tp} onChange={setTp} min={0} /></LabField>
              <LabField label="Ukuran posisi (lembar)" id="rr-size"><LabNumberInput id="rr-size" value={size} onChange={setSize} min={0} /></LabField>
            </div>
          </div>
        </LabToolPanel>
      }
      output={
        <LabOutputPanel footer={<LabCopyResults text={copyText} />}>
          {!result ? (
            <LabInterpretation>Isi entry, SL, dan TP.</LabInterpretation>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Risk</span>
                  <span>Reward</span>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full bg-muted/40">
                  <div
                    className="bg-loss/70 transition-all"
                    style={{ width: `${(1 / (1 + result.ratio)) * 100}%` }}
                  />
                  <div
                    className="bg-profit/70 transition-all"
                    style={{ width: `${(result.ratio / (1 + result.ratio)) * 100}%` }}
                  />
                </div>
                <p className="text-center text-sm font-medium tabular-nums">1 : {fmt(result.ratio)}</p>
              </div>
              <LabInterpretation tone={result.ratio >= 2 ? "positive" : result.ratio >= 1 ? "neutral" : "negative"}>
                {result.ratio >= 2
                  ? "R:R ≥ 1:2 — umumnya dianggap sehat jika win rate mendukung."
                  : result.ratio >= 1
                    ? "R:R positif, tapi di bawah 1:2 — pastikan win rate cukup tinggi."
                    : "R:R di bawah 1:1 — reward lebih kecil dari risk."}
              </LabInterpretation>
              <LabResultGrid className="mt-0 grid-cols-1 gap-2 sm:grid-cols-1">
                <LabResultTile label="Potensi rugi" value={fmt(result.riskAmount)} tone="negative" />
                <LabResultTile label="Potensi untung" value={fmt(result.rewardAmount)} tone="positive" />
                <LabResultTile label="Risk %" value={`${fmt(result.riskPercent)}%`} />
              </LabResultGrid>
              <Link href="/lab/breakeven" className="text-xs font-medium text-accent hover:underline">
                Lanjut ke Breakeven →
              </Link>
            </div>
          )}
        </LabOutputPanel>
      }
    />
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
    const cb = parseFloat(commBuy) || 0;
    const cs = parseFloat(commSell) || 0;
    const sp = parseFloat(spread) || 0;
    const tx = parseFloat(tax) || 0;
    const be = breakevenPrice({
      entryPrice: e, quantity: q,
      commissionBuy: cb, commissionSell: cs,
      spreadCost: sp, taxRate: tx, direction,
    });
    const totalCost = cb + cs + sp;
    return { be, cb, cs, sp, totalCost, taxRate: tx };
  }, [entry, qty, commBuy, commSell, spread, tax, direction]);

  const copyText = result ? `Breakeven: ${fmt(result.be)}\nTotal biaya: Rp ${fmt(result.totalCost, 0)}` : "";

  return (
    <LabCalculatorShell
      input={
        <LabToolPanel description="Komisi, spread, pajak, dan arah posisi.">
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
        </LabToolPanel>
      }
      output={
        <LabOutputPanel footer={<LabCopyResults text={copyText} />}>
          {!result ? (
            <LabInterpretation>Isi entry dan jumlah lembar.</LabInterpretation>
          ) : (
            <div className="flex flex-col gap-4">
              <LabResultTile label="Harga breakeven" value={fmt(result.be)} />
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["Komisi beli", `Rp ${fmt(result.cb, 0)}`],
                    ["Komisi jual", `Rp ${fmt(result.cs, 0)}`],
                    ["Spread", `Rp ${fmt(result.sp, 0)}`],
                    ["Pajak", `${fmt(result.taxRate)}% dari gain`],
                    ["Total biaya tetap", `Rp ${fmt(result.totalCost, 0)}`],
                  ].map(([label, value]) => (
                    <tr key={label} className="border-b border-border/40 last:border-0">
                      <td className="py-2 text-muted-foreground">{label}</td>
                      <td className="py-2 text-right font-medium tabular-nums">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <LabInterpretation>
                Harga impas {direction === "long" ? "di atas" : "di bawah"} entry karena biaya transaksi.
              </LabInterpretation>
            </div>
          )}
        </LabOutputPanel>
      }
    />
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

  const copyText = result
    ? `Kelly\nFull: ${fmt(result.full * 100)}%\nHalf: ${fmt(result.half * 100)}%\nQuarter: ${fmt(result.quarter * 100)}%`
    : "";

  return (
    <LabCalculatorShell
      input={
        <LabToolPanel description="Win rate dan R:R untuk estimasi fraksi modal.">
          <div className="grid gap-4 sm:grid-cols-2">
            <LabField label="Win rate" id="kelly-wr" suffix="%"><LabNumberInput id="kelly-wr" value={winRate} onChange={setWinRate} min={0} max={100} /></LabField>
            <LabField label="R:R ratio" id="kelly-rr"><LabNumberInput id="kelly-rr" value={rr} onChange={setRr} min={0} /></LabField>
          </div>
        </LabToolPanel>
      }
      output={
        <LabOutputPanel footer={<LabCopyResults text={copyText} />}>
          {!result ? (
            <LabInterpretation>Isi win rate dan R:R.</LabInterpretation>
          ) : (
            <div className="flex flex-col gap-4">
              <LabInterpretation tone={result.full > 0.25 ? "warning" : result.full > 0 ? "neutral" : "negative"}>
                {result.full <= 0
                  ? "Kelly negatif — strategi ini tidak layak secara matematis dengan asumsi ini."
                  : result.full > 0.25
                    ? "Full Kelly agresif (>25%) — pertimbangkan half atau quarter Kelly untuk trading nyata."
                    : "Half/quarter Kelly lebih konservatif dan umum dipakai praktisi."}
              </LabInterpretation>
              <LabResultGrid className="mt-0 grid-cols-1 gap-2">
                <LabResultTile label="Full Kelly" value={`${fmt(result.full * 100)}%`} tone={result.full > 0 ? "positive" : "negative"} />
                <LabResultTile label="Half Kelly (disarankan)" value={`${fmt(result.half * 100)}%`} />
                <LabResultTile label="Quarter Kelly" value={`${fmt(result.quarter * 100)}%`} />
              </LabResultGrid>
            </div>
          )}
        </LabOutputPanel>
      }
    />
  );
}

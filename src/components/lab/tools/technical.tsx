"use client";

import { useMemo, useState } from "react";

import { LabCalculatorShell, LabOutputPanel } from "@/components/lab/lab-calculator-shell";
import {
  LabCopyResults,
  LabDirectionToggle,
  LabField,
  LabInterpretation,
  LabNumberInput,
  LabPresetBar,
  LabResultGrid,
  LabResultTile,
  LabToolPanel,
} from "@/components/lab/lab-field";
import {
  atrTrailingStop,
  fibonacciLevels,
  rMultipleStats,
} from "@/lib/lab/technical";
import { cn } from "@/lib/utils";

function fmt(n: number, d = 2): string {
  return n.toLocaleString("id-ID", { maximumFractionDigits: d });
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

  const copyText = result
    ? `ATR Stop\nLevel: ${fmt(result.stopLevel)}\nJarak: ${fmt(result.distance)} (${fmt(result.distancePercent)}%)`
    : "";

  return (
    <LabCalculatorShell
      input={
        <LabToolPanel title="ATR & multiplier">
          <div className="grid gap-4 sm:grid-cols-2">
            <LabField label="Harga saat ini" id="atr-p"><LabNumberInput id="atr-p" value={price} onChange={setPrice} min={0} /></LabField>
            <LabField label="ATR" id="atr-a"><LabNumberInput id="atr-a" value={atr} onChange={setAtr} min={0} /></LabField>
            <LabField label="Multiplier" id="atr-m" helperText="Umumnya 1,5–3× ATR"><LabNumberInput id="atr-m" value={mult} onChange={setMult} min={0} step={0.5} /></LabField>
          </div>
          <div className="mt-4">
            <LabDirectionToggle value={direction} onChange={setDirection} />
          </div>
        </LabToolPanel>
      }
      output={
        <LabOutputPanel title="Stop level" footer={<LabCopyResults text={copyText} />}>
          <LabResultGrid className="mt-0 grid-cols-1 gap-2">
            <LabResultTile label="Level stop" value={fmt(result.stopLevel)} tone="negative" />
            <LabResultTile label="Jarak stop" value={fmt(result.distance)} />
            <LabResultTile label="Jarak %" value={`${fmt(result.distancePercent)}%`} />
          </LabResultGrid>
          <LabInterpretation className="mt-3">
            Stop = harga {direction === "long" ? "−" : "+"} (ATR × {mult}). Ini level saat ini — trailing stop bergerak mengikuti harga.
          </LabInterpretation>
        </LabOutputPanel>
      }
    />
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

  const copyText = levels
    ? [
        "Fibonacci Retracement",
        ...levels.retracements.map((l) => `${l.level}: ${fmt(l.price)}`),
        "Extension",
        ...levels.extensions.map((l) => `${l.level}: ${fmt(l.price)}`),
      ].join("\n")
    : "";

  const range = levels ? parseFloat(high) - parseFloat(low) : 0;

  return (
    <LabCalculatorShell
      input={
        <LabToolPanel title="Swing range">
          <div className="grid gap-4 sm:grid-cols-2">
            <LabField label="Swing high" id="fib-h"><LabNumberInput id="fib-h" value={high} onChange={setHigh} min={0} /></LabField>
            <LabField label="Swing low" id="fib-l"><LabNumberInput id="fib-l" value={low} onChange={setLow} min={0} /></LabField>
          </div>
        </LabToolPanel>
      }
      output={
        <LabOutputPanel title="Level" footer={<LabCopyResults text={copyText} />}>
          {!levels ? (
            <LabInterpretation>Isi swing high dan low.</LabInterpretation>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="relative rounded-lg border border-border/50 bg-muted/15 p-3">
                <div className="mb-1 flex justify-between text-[9px] text-muted-foreground">
                  <span>High {fmt(parseFloat(high), 0)}</span>
                  <span>Low {fmt(parseFloat(low), 0)}</span>
                </div>
                <div className="relative h-20 border-y border-border/30">
                  {levels.retracements.map((l) => {
                    const h = parseFloat(high);
                    const lo = parseFloat(low);
                    const pct = range > 0 ? ((h - l.price) / range) * 100 : 0;
                    return (
                      <div
                        key={l.level}
                        className="absolute left-0 right-0 border-t border-accent/50"
                        style={{ top: `${Math.min(100, Math.max(0, pct))}%` }}
                        title={`${l.level}: ${fmt(l.price)}`}
                      >
                        <span className="absolute right-0 -top-2.5 text-[9px] text-muted-foreground">
                          {l.level}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold">Retracement</p>
                  {levels.retracements.map((l) => (
                    <div key={l.level} className="flex justify-between border-b border-border/40 py-1.5 text-sm last:border-0">
                      <span className="text-muted-foreground">{l.level}</span>
                      <span className="font-medium tabular-nums">{fmt(l.price)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold">Extension</p>
                  {levels.extensions.map((l) => (
                    <div key={l.level} className="flex justify-between border-b border-border/40 py-1.5 text-sm last:border-0">
                      <span className="text-muted-foreground">{l.level}</span>
                      <span className="font-medium tabular-nums">{fmt(l.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </LabOutputPanel>
      }
    />
  );
}

type TradeRow = { id: string; value: string };

function newRow(value = ""): TradeRow {
  return { id: crypto.randomUUID(), value };
}

export function RMultipleTracker() {
  const [rows, setRows] = useState<TradeRow[]>([
    newRow("2"),
    newRow("-1"),
    newRow("3"),
    newRow("-1"),
    newRow("1"),
  ]);

  const stats = useMemo(() => {
    const trades = rows.map((r) => parseFloat(r.value)).filter((n) => !isNaN(n));
    return rMultipleStats(trades);
  }, [rows]);

  const copyText = [
    `R-Multiple (${stats.count} trade)`,
    `Total: ${fmt(stats.totalR)}R`,
    `Avg: ${fmt(stats.avgR)}R`,
    `Win rate: ${fmt(stats.winRate)}%`,
    `Expectancy: ${fmt(stats.expectancy)}R`,
  ].join("\n");

  const histogram = useMemo(() => {
    const values = rows.map((r) => parseFloat(r.value)).filter((n) => !isNaN(n));
    if (values.length === 0) return [];
    const min = Math.min(...values, -1);
    const max = Math.max(...values, 1);
    const bins = 8;
    const step = (max - min) / bins || 1;
    return Array.from({ length: bins }, (_, i) => {
      const from = min + i * step;
      const to = from + step;
      const count = values.filter((v) => v >= from && (i === bins - 1 ? v <= to : v < to)).length;
      return { from, to, count };
    });
  }, [rows]);

  const maxCount = Math.max(...histogram.map((b) => b.count), 1);

  return (
    <LabCalculatorShell
      input={
        <LabToolPanel title="Daftar trade (R)" description="1R = risiko awal per trade. Tambah/hapus baris.">
          <div className="flex flex-col gap-2">
            {rows.map((row, index) => (
              <div key={row.id} className="flex items-center gap-2">
                <span className="w-6 text-xs text-muted-foreground">{index + 1}</span>
                <LabNumberInput
                  id={`rm-${row.id}`}
                  value={row.value}
                  onChange={(v) =>
                    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, value: v } : r)))
                  }
                  step="any"
                />
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted/40 hover:text-loss"
                  disabled={rows.length <= 1}
                >
                  Hapus
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRows((prev) => [...prev, newRow()])}
              className="mt-2 self-start rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/30"
            >
              + Tambah trade
            </button>
          </div>
        </LabToolPanel>
      }
      output={
        <LabOutputPanel title="Statistik" footer={<LabCopyResults text={copyText} />}>
          <LabResultGrid className="mt-0 grid-cols-1 gap-2">
            <LabResultTile label="Total R" value={`${fmt(stats.totalR)}R`} tone={stats.totalR > 0 ? "positive" : "negative"} />
            <LabResultTile label="Rata-rata R" value={`${fmt(stats.avgR)}R`} />
            <LabResultTile label="Win rate" value={`${fmt(stats.winRate)}%`} />
            <LabResultTile label="Expectancy" value={`${fmt(stats.expectancy)}R`} tone={stats.expectancy > 0 ? "positive" : "negative"} />
          </LabResultGrid>
          {histogram.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-muted-foreground">Distribusi R</p>
              <div className="flex h-20 items-end gap-1">
                {histogram.map((bin, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 rounded-t-sm",
                      bin.from >= 0 ? "bg-profit/60" : "bg-loss/60"
                    )}
                    style={{ height: `${Math.max(4, (bin.count / maxCount) * 100)}%` }}
                    title={`${fmt(bin.from, 1)}–${fmt(bin.to, 1)}: ${bin.count}`}
                  />
                ))}
              </div>
            </div>
          )}
          <LabInterpretation tone={stats.expectancy > 0 ? "positive" : "negative"} className="mt-3">
            {stats.expectancy > 0
              ? "Expectancy positif — rata-rata setiap trade menghasilkan lebih dari 1R yang dirisikokan."
              : "Expectancy negatif — review strategi atau sample trade."}
          </LabInterpretation>
        </LabOutputPanel>
      }
    />
  );
}

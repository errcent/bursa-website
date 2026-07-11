"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { LabField, LabNumberInput, LabResultTile } from "@/components/lab/lab-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  floatingPercent,
  floatingPips,
  priceFromFloatingPercent,
  type Direction,
} from "@/lib/lab/floating";
import { cn } from "@/lib/utils";

function DirectionToggle({ value, onChange }: { value: Direction; onChange: (d: Direction) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-border bg-muted p-1">
      <button
        type="button"
        onClick={() => onChange("long")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
          value === "long" ? "bg-profit/15 text-profit" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <ArrowUp className="size-3.5" />
        Long (Beli)
      </button>
      <button
        type="button"
        onClick={() => onChange("short")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
          value === "short" ? "bg-loss/15 text-loss" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <ArrowDown className="size-3.5" />
        Short (Jual)
      </button>
    </div>
  );
}

function PipAndLeverageFields({
  showPips,
  setShowPips,
  pipSize,
  setPipSize,
  leverage,
  setLeverage,
  idPrefix,
}: {
  showPips: boolean;
  setShowPips: (v: boolean) => void;
  pipSize: string;
  setPipSize: (v: string) => void;
  leverage: string;
  setLeverage: (v: string) => void;
  idPrefix: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={showPips}
          onChange={(e) => setShowPips(e.target.checked)}
          className="size-4 rounded border-border accent-foreground"
        />
        Tampilkan estimasi pip (forex)
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        {showPips && (
          <LabField label="Ukuran 1 pip" id={`${idPrefix}-pipsize`} helperText="Umumnya 0.0001 (mayor) / 0.01 (JPY)">
            <LabNumberInput id={`${idPrefix}-pipsize`} value={pipSize} onChange={setPipSize} min={0} />
          </LabField>
        )}
        <LabField label="Leverage (opsional)" id={`${idPrefix}-leverage`} suffix="x">
          <LabNumberInput id={`${idPrefix}-leverage`} value={leverage} onChange={setLeverage} min={0} />
        </LabField>
      </div>
    </div>
  );
}

function ModeA() {
  const [direction, setDirection] = useState<Direction>("long");
  const [entry, setEntry] = useState("15000");
  const [current, setCurrent] = useState("15300");
  const [showPips, setShowPips] = useState(false);
  const [pipSize, setPipSize] = useState("0.0001");
  const [leverage, setLeverage] = useState("1");

  const entryNum = Number(entry) || 0;
  const currentNum = Number(current) || 0;
  const pct = floatingPercent(entryNum, currentNum, direction);
  const leveraged = pct * (Number(leverage) || 1);
  const pips = floatingPips(entryNum, currentNum, direction, Number(pipSize) || 0);

  return (
    <div className="flex flex-col gap-5">
      <DirectionToggle value={direction} onChange={setDirection} />
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Harga entry" id="fa-entry">
          <LabNumberInput id="fa-entry" value={entry} onChange={setEntry} min={0} />
        </LabField>
        <LabField label="Harga saat ini" id="fa-current">
          <LabNumberInput id="fa-current" value={current} onChange={setCurrent} min={0} />
        </LabField>
      </div>
      <PipAndLeverageFields
        showPips={showPips}
        setShowPips={setShowPips}
        pipSize={pipSize}
        setPipSize={setPipSize}
        leverage={leverage}
        setLeverage={setLeverage}
        idPrefix="fa"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <LabResultTile
          label="Floating P/L"
          value={`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`}
          tone={pct >= 0 ? "positive" : "negative"}
        />
        <LabResultTile
          label="Floating (dengan leverage)"
          value={`${leveraged >= 0 ? "+" : ""}${leveraged.toFixed(2)}%`}
          tone={leveraged >= 0 ? "positive" : "negative"}
        />
        {showPips && (
          <LabResultTile
            label="Estimasi pip"
            value={`${pips >= 0 ? "+" : ""}${pips.toFixed(1)} pip`}
            tone={pips >= 0 ? "positive" : "negative"}
          />
        )}
      </div>
    </div>
  );
}

function ModeB() {
  const [direction, setDirection] = useState<Direction>("long");
  const [entry, setEntry] = useState("15000");
  const [targetFloating, setTargetFloating] = useState("5");

  const entryNum = Number(entry) || 0;
  const targetNum = Number(targetFloating) || 0;
  const targetPrice = priceFromFloatingPercent(entryNum, targetNum, direction);
  const priceMustRise = (targetNum >= 0) === (direction === "long");

  return (
    <div className="flex flex-col gap-5">
      <DirectionToggle value={direction} onChange={setDirection} />
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Harga entry" id="fb-entry">
          <LabNumberInput id="fb-entry" value={entry} onChange={setEntry} min={0} />
        </LabField>
        <LabField label="Target floating" id="fb-target" suffix="%">
          <LabNumberInput id="fb-target" value={targetFloating} onChange={setTargetFloating} />
        </LabField>
      </div>
      <LabResultTile label="Harga yang harus dicapai" value={targetPrice.toLocaleString("id-ID", { maximumFractionDigits: 6 })} />
      <p className="text-sm text-muted-foreground">
        Untuk mencapai floating {targetNum >= 0 ? "+" : ""}
        {targetNum}% pada posisi {direction === "long" ? "Long (Beli)" : "Short (Jual)"} dari harga
        entry {entryNum.toLocaleString("id-ID")}, harga perlu {priceMustRise ? "naik" : "turun"} ke{" "}
        <span className="font-medium text-foreground">
          {targetPrice.toLocaleString("id-ID", { maximumFractionDigits: 6 })}
        </span>
        .
      </p>
    </div>
  );
}

function ModeC() {
  const [direction, setDirection] = useState<Direction>("long");
  const [entry, setEntry] = useState("15000");
  const [targetPrice, setTargetPrice] = useState("15750");
  const [showPips, setShowPips] = useState(false);
  const [pipSize, setPipSize] = useState("0.0001");
  const [leverage, setLeverage] = useState("1");

  const entryNum = Number(entry) || 0;
  const targetNum = Number(targetPrice) || 0;
  const pct = floatingPercent(entryNum, targetNum, direction);
  const leveraged = pct * (Number(leverage) || 1);
  const pips = floatingPips(entryNum, targetNum, direction, Number(pipSize) || 0);

  return (
    <div className="flex flex-col gap-5">
      <DirectionToggle value={direction} onChange={setDirection} />
      <div className="grid gap-4 sm:grid-cols-2">
        <LabField label="Harga entry" id="fc-entry">
          <LabNumberInput id="fc-entry" value={entry} onChange={setEntry} min={0} />
        </LabField>
        <LabField label="Harga target / skenario" id="fc-target">
          <LabNumberInput id="fc-target" value={targetPrice} onChange={setTargetPrice} min={0} />
        </LabField>
      </div>
      <PipAndLeverageFields
        showPips={showPips}
        setShowPips={setShowPips}
        pipSize={pipSize}
        setPipSize={setPipSize}
        leverage={leverage}
        setLeverage={setLeverage}
        idPrefix="fc"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <LabResultTile
          label="Floating pada harga skenario"
          value={`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`}
          tone={pct >= 0 ? "positive" : "negative"}
        />
        <LabResultTile
          label="Floating (dengan leverage)"
          value={`${leveraged >= 0 ? "+" : ""}${leveraged.toFixed(2)}%`}
          tone={leveraged >= 0 ? "positive" : "negative"}
        />
        {showPips && (
          <LabResultTile
            label="Estimasi pip"
            value={`${pips >= 0 ? "+" : ""}${pips.toFixed(1)} pip`}
            tone={pips >= 0 ? "positive" : "negative"}
          />
        )}
      </div>
    </div>
  );
}

export function FloatingCalculator() {
  return (
    <div className="surface-card p-5 sm:p-6">
      <Tabs defaultValue="a">
        <TabsList className="mb-5 w-full sm:w-auto">
          <TabsTrigger value="a">Floating saat ini</TabsTrigger>
          <TabsTrigger value="b">Cari harga target</TabsTrigger>
          <TabsTrigger value="c">Floating skenario</TabsTrigger>
        </TabsList>
        <TabsContent value="a">
          <ModeA />
        </TabsContent>
        <TabsContent value="b">
          <ModeB />
        </TabsContent>
        <TabsContent value="c">
          <ModeC />
        </TabsContent>
      </Tabs>
    </div>
  );
}

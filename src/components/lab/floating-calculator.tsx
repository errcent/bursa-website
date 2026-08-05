"use client";

import { useState } from "react";

import { LabCalculatorShell, LabOutputPanel } from "@/components/lab/lab-calculator-shell";
import {
  LabCheckbox,
  LabCopyResults,
  LabDirectionToggle,
  LabField,
  LabInterpretation,
  LabNumberInput,
  LabPresetBar,
  LabResultTile,
  LabToolPanel,
} from "@/components/lab/lab-field";
import { cn } from "@/lib/utils";
import {
  floatingPercent,
  floatingPips,
  priceFromFloatingPercent,
  type Direction,
} from "@/lib/lab/floating";

type FloatingMode = "current" | "target-price" | "scenario";

const MODES: { id: FloatingMode; label: string }[] = [
  { id: "current", label: "Floating saat ini" },
  { id: "target-price", label: "Cari harga target" },
  { id: "scenario", label: "Floating skenario" },
];

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
      <LabCheckbox
        id={`${idPrefix}-pips`}
        checked={showPips}
        onChange={setShowPips}
        label="Estimasi pip (forex)"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {showPips && (
          <LabField label="Ukuran 1 pip" id={`${idPrefix}-pipsize`}>
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

export function FloatingCalculator() {
  const [mode, setMode] = useState<FloatingMode>("current");
  const [direction, setDirection] = useState<Direction>("long");
  const [entry, setEntry] = useState("5000");
  const [current, setCurrent] = useState("5150");
  const [targetFloating, setTargetFloating] = useState("5");
  const [targetPrice, setTargetPrice] = useState("5250");
  const [showPips, setShowPips] = useState(false);
  const [pipSize, setPipSize] = useState("0.0001");
  const [leverage, setLeverage] = useState("1");
  const [preset, setPreset] = useState<string>();

  const entryNum = Number(entry) || 0;
  const currentNum = Number(current) || 0;
  const targetPriceNum = Number(targetPrice) || 0;
  const targetFloatingNum = Number(targetFloating) || 0;
  const leverageNum = Number(leverage) || 1;

  const currentPct = floatingPercent(entryNum, currentNum, direction);
  const currentLeveraged = currentPct * leverageNum;
  const currentPips = floatingPips(entryNum, currentNum, direction, Number(pipSize) || 0);

  const resolvedTargetPrice = priceFromFloatingPercent(entryNum, targetFloatingNum, direction);
  const scenarioPct = floatingPercent(entryNum, targetPriceNum, direction);
  const scenarioPips = floatingPips(entryNum, targetPriceNum, direction, Number(pipSize) || 0);

  let copyText = "";
  let output: React.ReactNode = null;

  if (mode === "current") {
    copyText = `Floating P/L: ${currentPct >= 0 ? "+" : ""}${currentPct.toFixed(2)}%\nLeveraged: ${currentLeveraged >= 0 ? "+" : ""}${currentLeveraged.toFixed(2)}%`;
    output = (
      <>
        <LabResultTile
          label="Floating"
          value={`${currentPct >= 0 ? "+" : ""}${currentPct.toFixed(2)}%`}
          tone={currentPct >= 0 ? "positive" : "negative"}
        />
        <LabResultTile
          label="Dengan leverage"
          value={`${currentLeveraged >= 0 ? "+" : ""}${currentLeveraged.toFixed(2)}%`}
          tone={currentLeveraged >= 0 ? "positive" : "negative"}
          className="mt-2"
        />
        {showPips && (
          <LabResultTile
            label="Estimasi pip"
            value={`${currentPips >= 0 ? "+" : ""}${currentPips.toFixed(1)} pip`}
            tone={currentPips >= 0 ? "positive" : "negative"}
            className="mt-2"
          />
        )}
        <LabInterpretation className="mt-3">
          Posisi {direction === "long" ? "long" : "short"} · entry vs harga saat ini.
        </LabInterpretation>
      </>
    );
  } else if (mode === "target-price") {
    copyText = `Target floating ${targetFloatingNum}% → harga ${resolvedTargetPrice.toLocaleString("id-ID")}`;
    output = (
      <>
        <LabResultTile
          label="Harga yang harus dicapai"
          value={resolvedTargetPrice.toLocaleString("id-ID", { maximumFractionDigits: 6 })}
        />
        <LabInterpretation className="mt-3">
          Untuk floating {targetFloatingNum >= 0 ? "+" : ""}
          {targetFloatingNum}% dari entry {entryNum.toLocaleString("id-ID")}.
        </LabInterpretation>
      </>
    );
  } else {
    copyText = `Skenario: ${scenarioPct >= 0 ? "+" : ""}${scenarioPct.toFixed(2)}%`;
    output = (
      <>
        <LabResultTile
          label="Floating"
          value={`${scenarioPct >= 0 ? "+" : ""}${scenarioPct.toFixed(2)}%`}
          tone={scenarioPct >= 0 ? "positive" : "negative"}
        />
        {showPips && (
          <LabResultTile
            label="Estimasi pip"
            value={`${scenarioPips >= 0 ? "+" : ""}${scenarioPips.toFixed(1)} pip`}
            tone={scenarioPips >= 0 ? "positive" : "negative"}
            className="mt-2"
          />
        )}
      </>
    );
  }

  return (
    <LabCalculatorShell
      input={
        <LabToolPanel>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mode</p>
              <div className="flex flex-wrap gap-2">
                {MODES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={cn(
                      "lab-pill",
                      mode === item.id ? "lab-pill--active" : "lab-pill--idle"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === "current" && (
              <LabPresetBar
                activeId={preset}
                presets={[
                  { id: "idx", label: "Saham IDX" },
                  { id: "forex", label: "Forex" },
                ]}
                onSelect={(id) => {
                  setPreset(id);
                  if (id === "idx") {
                    setEntry("5000");
                    setCurrent("5150");
                    setShowPips(false);
                    setLeverage("1");
                  } else {
                    setEntry("1.0850");
                    setCurrent("1.0875");
                    setShowPips(true);
                    setPipSize("0.0001");
                  }
                }}
              />
            )}

            <LabDirectionToggle value={direction} onChange={setDirection} />

            {mode === "current" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <LabField label="Harga entry" id="fa-entry">
                  <LabNumberInput id="fa-entry" value={entry} onChange={setEntry} min={0} />
                </LabField>
                <LabField label="Harga saat ini" id="fa-current">
                  <LabNumberInput id="fa-current" value={current} onChange={setCurrent} min={0} />
                </LabField>
              </div>
            )}

            {mode === "target-price" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <LabField label="Harga entry" id="fb-entry">
                  <LabNumberInput id="fb-entry" value={entry} onChange={setEntry} min={0} />
                </LabField>
                <LabField label="Target floating" id="fb-target" suffix="%">
                  <LabNumberInput id="fb-target" value={targetFloating} onChange={setTargetFloating} />
                </LabField>
              </div>
            )}

            {mode === "scenario" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <LabField label="Harga entry" id="fc-entry">
                  <LabNumberInput id="fc-entry" value={entry} onChange={setEntry} min={0} />
                </LabField>
                <LabField label="Harga skenario" id="fc-target">
                  <LabNumberInput id="fc-target" value={targetPrice} onChange={setTargetPrice} min={0} />
                </LabField>
              </div>
            )}

            {(mode === "current" || mode === "scenario") && (
              <PipAndLeverageFields
                showPips={showPips}
                setShowPips={setShowPips}
                pipSize={pipSize}
                setPipSize={setPipSize}
                leverage={leverage}
                setLeverage={setLeverage}
                idPrefix={mode === "current" ? "fa" : "fc"}
              />
            )}
          </div>
        </LabToolPanel>
      }
      output={<LabOutputPanel footer={<LabCopyResults text={copyText} />}>{output}</LabOutputPanel>}
    />
  );
}

"use client";

import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { AuthField, authInputClassName } from "@/components/auth-field";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Instrument } from "@/lib/types";
import type { ComposeSignalInput, SignalDirection } from "@/lib/chat/types";

interface SignalComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (signal: ComposeSignalInput) => void;
}

const instruments: Instrument[] = ["Saham", "Crypto", "Forex"];

export function SignalComposeModal({ open, onOpenChange, onSubmit }: SignalComposeModalProps) {
  const [ticker, setTicker] = useState("");
  const [direction, setDirection] = useState<SignalDirection>("LONG");
  const [entry, setEntry] = useState("");
  const [target, setTarget] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [instrument, setInstrument] = useState<Instrument>("Saham");
  const [note, setNote] = useState("");

  const reset = () => {
    setTicker("");
    setDirection("LONG");
    setEntry("");
    setTarget("");
    setStopLoss("");
    setInstrument("Saham");
    setNote("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !entry || !target || !stopLoss) return;

    onSubmit({
      ticker: ticker.toUpperCase().replace(/^\$/, ""),
      direction,
      entry: parseFloat(entry),
      target: parseFloat(target),
      stopLoss: parseFloat(stopLoss),
      instrument,
      note: note.trim() || undefined,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto sm:max-h-[85vh]">
        <SheetHeader>
          <SheetTitle>Kirim Sinyal Trading</SheetTitle>
          <SheetDescription>
            Bagikan setup trading ke komunitas. Pastikan entry, target, dan stop loss sudah jelas.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4">
          <AuthField label="Ticker" id="signal-ticker" helperText="Contoh: BBCA, BTC, EURUSD">
            <input
              id="signal-ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="BBCA"
              className={authInputClassName}
              required
            />
          </AuthField>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Arah</span>
            <div className="flex gap-2">
              {(["LONG", "SHORT"] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setDirection(dir)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                    direction === dir
                      ? dir === "LONG"
                        ? "border-profit/40 bg-profit/10 text-profit"
                        : "border-loss/40 bg-loss/10 text-loss"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  {dir === "LONG" ? (
                    <TrendingUp className="size-4" />
                  ) : (
                    <TrendingDown className="size-4" />
                  )}
                  {dir}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Instrumen</span>
            <div className="flex flex-wrap gap-2">
              {instruments.map((inst) => (
                <button
                  key={inst}
                  type="button"
                  onClick={() => setInstrument(inst)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    instrument === inst
                      ? "border-accent/40 bg-accent/15 text-accent"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <AuthField label="Entry" id="signal-entry">
              <input
                id="signal-entry"
                type="number"
                step="any"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="9850"
                className={authInputClassName}
                required
              />
            </AuthField>
            <AuthField label="Target" id="signal-target">
              <input
                id="signal-target"
                type="number"
                step="any"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="10200"
                className={authInputClassName}
                required
              />
            </AuthField>
            <AuthField label="Stop Loss" id="signal-sl">
              <input
                id="signal-sl"
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="9600"
                className={authInputClassName}
                required
              />
            </AuthField>
          </div>

          <AuthField label="Catatan (opsional)" id="signal-note">
            <textarea
              id="signal-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Alasan setup, timeframe, dll."
              rows={2}
              className={cn(authInputClassName, "resize-none")}
            />
          </AuthField>

          <SheetFooter className="flex-row gap-2 px-0 pb-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" className="btn-primary">
              Kirim Sinyal
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

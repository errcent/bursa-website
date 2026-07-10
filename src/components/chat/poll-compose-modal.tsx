"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

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
import type { ComposePollInput } from "@/lib/chat/types";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

const DURATION_PRESETS: { label: string; hours: number | undefined }[] = [
  { label: "Tanpa batas", hours: undefined },
  { label: "1 jam", hours: 1 },
  { label: "24 jam", hours: 24 },
  { label: "3 hari", hours: 72 },
  { label: "7 hari", hours: 168 },
];

interface PollComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (poll: ComposePollInput) => void;
}

export function PollComposeModal({ open, onOpenChange, onSubmit }: PollComposeModalProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [durationHours, setDurationHours] = useState<number | undefined>(24);

  const reset = () => {
    setQuestion("");
    setOptions(["", ""]);
    setDurationHours(24);
  };

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);
  const canSubmit = question.trim().length > 0 && trimmedOptions.length >= MIN_OPTIONS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    onSubmit({
      question: question.trim(),
      options: trimmedOptions,
      durationHours,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto sm:max-h-[85vh]">
        <SheetHeader>
          <SheetTitle>Buat Polling</SheetTitle>
          <SheetDescription>
            Tanya sentimen atau opini komunitas. Minimal 2 opsi, maksimal 6.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4">
          <AuthField label="Pertanyaan" id="poll-question">
            <input
              id="poll-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, 280))}
              placeholder="Contoh: Sentimen minggu ini untuk IHSG?"
              className={authInputClassName}
              required
              maxLength={280}
            />
          </AuthField>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Opsi jawaban</span>
            {options.map((opt, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={opt}
                  onChange={(e) => updateOption(index, e.target.value.slice(0, 100))}
                  placeholder={`Opsi ${index + 1}`}
                  className={cn(authInputClassName, "flex-1")}
                  required={index < MIN_OPTIONS}
                  maxLength={100}
                />
                {options.length > MIN_OPTIONS && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-10 shrink-0"
                    onClick={() => removeOption(index)}
                    aria-label={`Hapus opsi ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            {options.length < MAX_OPTIONS && (
              <Button type="button" variant="outline" size="sm" className="self-start" onClick={addOption}>
                <Plus className="mr-1.5 size-3.5" />
                Tambah opsi
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Durasi</span>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setDurationHours(preset.hours)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    durationHours === preset.hours
                      ? "border-accent/40 bg-accent/15 text-accent"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <SheetFooter className="flex-row gap-2 px-0 pb-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" className="btn-primary" disabled={!canSubmit}>
              Buat Polling
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

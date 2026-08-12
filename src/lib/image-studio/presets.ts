import type { PromptPresetId } from "@/lib/image-studio/types";

const PRESET_SUFFIX: Record<Exclude<PromptPresetId, "custom">, string> = {
  portrait:
    "Ultra-photorealistic headshot, natural skin texture with pores, asymmetric features, soft window light, 85mm lens, subtle sensor noise, no beauty retouching, lifelike eyes with catchlights",
  "still-life":
    "Editorial still life product photograph, deep navy charcoal gradient background, subtle film grain, soft window light, shallow depth of field, muted desaturated palette, generous negative space, inanimate objects only",
};

export function applyPromptPreset(prompt: string, preset?: PromptPresetId) {
  const trimmed = prompt.trim();
  if (!preset || preset === "custom") return trimmed;
  const suffix = PRESET_SUFFIX[preset];
  if (!trimmed) return suffix;
  return `${trimmed}. ${suffix}`;
}

export const PROMPT_PRESETS: { id: PromptPresetId; label: string; description: string }[] = [
  {
    id: "portrait",
    label: "Portrait hyperrealistic",
    description: "Wajah manusia fotorealistik dengan tekstur kulit natural",
  },
  {
    id: "still-life",
    label: "Editorial still-life",
    description: "Gaya Bursa Nalar - objek editorial tanpa manusia",
  },
  {
    id: "custom",
    label: "Custom",
    description: "Prompt apa adanya tanpa suffix preset",
  },
];

export const ASPECT_PRESETS = [
  { id: "16:9", label: "16:9", width: 1280, height: 720 },
  { id: "1:1", label: "1:1", width: 1024, height: 1024 },
  { id: "4:5", label: "4:5", width: 1024, height: 1280 },
] as const;

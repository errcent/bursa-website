import type { ThumbnailStyle } from "./ai-prompt-builder";
import { MASTERCLASS_PORTRAIT_NEGATIVE } from "./masterclass-prompts";

export const STILL_LIFE_NEGATIVE_PROMPT =
  "person, people, human, face, portrait, woman, man, model, selfie, body, hands, fingers, anime, character, text, typography, logo, watermark, ui, chart, candlestick, trading screen";

export function negativePromptForStyle(style: ThumbnailStyle): string {
  return style === "masterclass-portrait"
    ? MASTERCLASS_PORTRAIT_NEGATIVE
    : STILL_LIFE_NEGATIVE_PROMPT;
}

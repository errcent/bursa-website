import type { DisplayCurrency } from "@/lib/note/prefs";
import type { TrackQuoteCurrency } from "@/lib/note/track/types";

/** Currencies that can appear on stored rows. */
export type MoneyCurrency = DisplayCurrency | TrackQuoteCurrency;

export type FxRates = {
  /** IDR per 1 USD (also used for USDT at 1:1 USD). */
  usdIdr: number;
};

export type FxContext = {
  /** Reporting / display currency for aggregates. */
  display: DisplayCurrency;
  rates: FxRates;
};

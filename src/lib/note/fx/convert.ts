import type { DisplayCurrency } from "@/lib/note/prefs";

import type { FxRates, MoneyCurrency } from "./types";

function asUsdPeg(ccy: MoneyCurrency): "USD" | "IDR" {
  if (ccy === "IDR") return "IDR";
  return "USD";
}

/** Convert amount between USD-pegged (USD/USDT) and IDR using a single spot rate. */
export function convertMoney(
  amount: number,
  from: MoneyCurrency,
  to: DisplayCurrency,
  rates: FxRates
): number {
  if (!Number.isFinite(amount)) return 0;
  const fromBucket = asUsdPeg(from);
  const toBucket = asUsdPeg(to);
  if (fromBucket === toBucket) return amount;
  if (fromBucket === "USD" && toBucket === "IDR") return amount * rates.usdIdr;
  return amount / rates.usdIdr;
}

export function fxFootnote(
  display: DisplayCurrency,
  rates: FxRates,
  locale: "id" | "en"
): string {
  if (display === "USD" || display === "USDT") {
    return locale === "en"
      ? `Converted @ 1 USD = ${rates.usdIdr.toLocaleString("en-US")} IDR where needed.`
      : `Dikonversi @ 1 USD = ${rates.usdIdr.toLocaleString("id-ID")} IDR bila perlu.`;
  }
  return locale === "en"
    ? `Converted to IDR @ 1 USD = ${rates.usdIdr.toLocaleString("en-US")} IDR where needed.`
    : `Dikonversi ke IDR @ 1 USD = ${rates.usdIdr.toLocaleString("id-ID")} bila perlu.`;
}

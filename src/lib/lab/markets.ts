export type LabMarket = "idx" | "forex" | "crypto";

export const LAB_MARKETS: { id: LabMarket; label: string; hint: string }[] = [
  { id: "idx", label: "Saham IDX", hint: "Lot 100 lembar · Rp" },
  { id: "forex", label: "Forex", hint: "Standard lot · pip" },
  { id: "crypto", label: "Crypto", hint: "USDT · perpetual" },
];

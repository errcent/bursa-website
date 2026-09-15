export type EconomicEventType =
  | "growth"
  | "inflation"
  | "employment"
  | "central_bank"
  | "bonds"
  | "housing"
  | "consumer_surveys"
  | "business_surveys"
  | "speeches"
  | "misc";

const RULES: { type: EconomicEventType; re: RegExp }[] = [
  { type: "employment", re: /\b(nfp|non-farm|payroll|jobless|unemployment|employment|adp|jolts|participation rate)\b/i },
  { type: "inflation", re: /\b(cpi|ppi|pce|inflation|deflator|price index|core price)\b/i },
  { type: "growth", re: /\b(gdp|growth|production|industrial|manufacturing|retail sales|trade balance|current account)\b/i },
  { type: "central_bank", re: /\b(fomc|fed|ecb|boe|boj|rba|rbnz|snb|boc|rate decision|interest rate|monetary policy|policy statement)\b/i },
  { type: "bonds", re: /\b(bond|auction|treasury|gilt|note auction|bill auction)\b/i },
  { type: "housing", re: /\b(housing|home sales|building permits|housing starts|mortgage|hpi|case-shiller)\b/i },
  { type: "consumer_surveys", re: /\b(consumer confidence|consumer sentiment|michigan|gfk|confidence)\b/i },
  { type: "business_surveys", re: /\b(pmi|ism|business confidence|services index|manufacturing index|flash)\b/i },
  { type: "speeches", re: /\b(speaks|speech|testimony|press conference|summit|meeting minutes|minutes)\b/i },
];

/** Heuristic category aligned with Forex Factory event-type filter buckets. */
export function classifyEventType(title: string): EconomicEventType {
  const t = title.trim();
  for (const { type, re } of RULES) {
    if (re.test(t)) return type;
  }
  return "misc";
}

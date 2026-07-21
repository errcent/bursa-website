import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeftRight,
  Bitcoin,
  CircleDollarSign,
  Crosshair,
  Dices,
  FlaskConical,
  Gauge,
  Layers,
  Percent,
  RefreshCw,
  Scale,
  Shield,
  Sparkles,
  Target,
  TrendingDown,
  Zap,
} from "lucide-react";

export type LabToolCategory =
  | "risk-money"
  | "performance"
  | "trading-mechanics"
  | "technical"
  | "portfolio"
  | "backtesting";

export type LabToolDifficulty = "pemula" | "menengah" | "lanjut";

export type LabCategory = {
  id: LabToolCategory;
  title: string;
  description: string;
  accent: string;
};

export const labCategories: LabCategory[] = [
  {
    id: "risk-money",
    title: "Manajemen Risiko & Modal",
    description: "Ukuran posisi, breakeven, dan Kelly — fondasi sebelum kamu menekan tombol entry.",
    accent: "from-emerald/20 to-transparent",
  },
  {
    id: "performance",
    title: "Performa & Probabilitas",
    description: "Monte Carlo, expectancy, dan distribusi hasil — uji edge strategi secara matematis.",
    accent: "from-accent/20 to-transparent",
  },
  {
    id: "trading-mechanics",
    title: "Mekanika Trading",
    description: "Pip, lot, margin, swap, komisi — pahami biaya nyata di forex, saham, dan crypto.",
    accent: "from-amber/15 to-transparent",
  },
  {
    id: "technical",
    title: "Teknikal & Pasar",
    description: "Volatilitas, trailing stop ATR, Fibonacci, dan pelacakan R-multiple.",
    accent: "from-chart-2/15 to-transparent",
  },
  {
    id: "portfolio",
    title: "Portofolio & Lanjutan",
    description: "Analisis risiko agregat untuk portofolio multi-aset dan multi-strategi.",
    accent: "from-primary/15 to-transparent",
  },
  {
    id: "backtesting",
    title: "Uji Strategi & Backtest",
    description: "Eksperimen aturan entry/exit sederhana pada data harga historis.",
    accent: "from-chart-1/20 to-transparent",
  },
];

export type LabTool = {
  id: string;
  href: string;
  title: string;
  shortTitle?: string;
  description: string;
  icon: LucideIcon;
  tag: string;
  category: LabToolCategory;
  featured?: boolean;
  difficulty?: LabToolDifficulty;
  timeEstimate?: string;
  keywords?: string[];
};

export const labTools: LabTool[] = [
  {
    id: "position-size",
    href: "/lab/position-size",
    title: "Kalkulator Ukuran Posisi",
    shortTitle: "Ukuran Posisi",
    description:
      "Hitung lot atau lembar optimal berdasarkan persentase risiko, jarak stop loss, dan modal trading.",
    icon: Target,
    tag: "Kalkulator",
    category: "risk-money",
    featured: true,
    difficulty: "pemula",
    timeEstimate: "1 menit",
    keywords: ["position size", "ukuran posisi", "risiko", "stop loss", "modal"],
  },
  {
    id: "risk-reward",
    href: "/lab/risk-reward",
    title: "Kalkulator Risk-Reward",
    shortTitle: "Risk-Reward",
    description:
      "Ukur rasio risk:reward, jarak stop loss & take profit, serta potensi untung/rugi per trade.",
    icon: Scale,
    tag: "Kalkulator",
    category: "risk-money",
    difficulty: "pemula",
    timeEstimate: "1 menit",
    keywords: ["rr", "risk reward", "take profit", "stop loss"],
  },
  {
    id: "breakeven",
    href: "/lab/breakeven",
    title: "Kalkulator Harga Breakeven",
    shortTitle: "Harga Breakeven",
    description:
      "Tentukan harga impas setelah komisi, spread, dan pajak — long maupun short.",
    icon: CircleDollarSign,
    tag: "Kalkulator",
    category: "risk-money",
    difficulty: "pemula",
    timeEstimate: "2 menit",
    keywords: ["breakeven", "impas", "komisi", "spread"],
  },
  {
    id: "kelly-criterion",
    href: "/lab/kelly-criterion",
    title: "Kalkulator Kelly Criterion",
    shortTitle: "Kelly Criterion",
    description:
      "Estimasi fraksi modal optimal (full, half, quarter Kelly) dari win rate dan R:R.",
    icon: Percent,
    tag: "Kalkulator",
    category: "risk-money",
    difficulty: "menengah",
    timeEstimate: "1 menit",
    keywords: ["kelly", "position sizing", "fraksi modal"],
  },
  {
    id: "monte-carlo",
    href: "/lab/monte-carlo",
    title: "Simulator Monte Carlo",
    shortTitle: "Monte Carlo",
    description:
      "Simulasikan ribuan skenario — probabilitas ruin, equity curve, max drawdown, dan distribusi saldo akhir.",
    icon: Dices,
    tag: "Simulasi",
    category: "performance",
    featured: true,
    difficulty: "menengah",
    timeEstimate: "3 menit",
    keywords: ["monte carlo", "simulasi", "drawdown", "ruin"],
  },
  {
    id: "trade-expectancy",
    href: "/lab/trade-expectancy",
    title: "Kalkulator Trade Expectancy",
    shortTitle: "Trade Expectancy",
    description:
      "Hitung ekspektasi per trade dan jelajahi matriks win rate × R:R untuk menilai kelayakan strategi.",
    icon: Sparkles,
    tag: "Kalkulator",
    category: "performance",
    featured: true,
    difficulty: "menengah",
    timeEstimate: "2 menit",
    keywords: ["expectancy", "win rate", "matriks", "edge"],
  },
  {
    id: "floating-calculator",
    href: "/lab/floating-calculator",
    title: "Kalkulator Floating P/L",
    shortTitle: "Floating P/L",
    description:
      "Hitung floating profit/loss dari entry vs harga saat ini, atau cari harga target dari floating yang diinginkan.",
    icon: Gauge,
    tag: "Kalkulator",
    category: "trading-mechanics",
    difficulty: "pemula",
    timeEstimate: "1 menit",
    keywords: ["floating", "unrealized", "pip", "long short"],
  },
  {
    id: "pip-value",
    href: "/lab/pip-value",
    title: "Kalkulator Nilai Pip & Point",
    shortTitle: "Nilai Pip",
    description:
      "Hitung nilai per pip/point untuk forex dan indeks berdasarkan lot size, pair, dan kurs.",
    icon: Crosshair,
    tag: "Kalkulator",
    category: "trading-mechanics",
    difficulty: "pemula",
    timeEstimate: "1 menit",
    keywords: ["pip", "point", "forex", "lot"],
  },
  {
    id: "lot-size",
    href: "/lab/lot-size",
    title: "Konversi Lot & Kontrak",
    shortTitle: "Lot Size",
    description:
      "Konversi antara lot standar, mini, mikro, unit kontrak, dan nilai nominal posisi.",
    icon: Layers,
    tag: "Kalkulator",
    category: "trading-mechanics",
    difficulty: "pemula",
    timeEstimate: "1 menit",
    keywords: ["lot", "mini", "mikro", "kontrak"],
  },
  {
    id: "margin-leverage",
    href: "/lab/margin-leverage",
    title: "Kalkulator Margin & Leverage",
    shortTitle: "Margin & Leverage",
    description:
      "Hitung margin requirement, buying power, dan dampak leverage pada eksposur posisi.",
    icon: Zap,
    tag: "Kalkulator",
    category: "trading-mechanics",
    difficulty: "pemula",
    timeEstimate: "1 menit",
    keywords: ["margin", "leverage", "buying power"],
  },
  {
    id: "swap-rollover",
    href: "/lab/swap-rollover",
    title: "Kalkulator Swap & Rollover",
    shortTitle: "Swap / Rollover",
    description:
      "Estimasi biaya swap/rollover harian untuk posisi forex berdasarkan lot size dan rate.",
    icon: RefreshCw,
    tag: "Kalkulator",
    category: "trading-mechanics",
    difficulty: "menengah",
    timeEstimate: "2 menit",
    keywords: ["swap", "rollover", "overnight", "forex"],
  },
  {
    id: "commission-slippage",
    href: "/lab/commission-slippage",
    title: "Dampak Komisi & Slippage",
    shortTitle: "Komisi & Slippage",
    description:
      "Ukur bagaimana komisi dan slippage menggerus expectancy dan menaikkan breakeven win rate.",
    icon: ArrowLeftRight,
    tag: "Kalkulator",
    category: "trading-mechanics",
    difficulty: "menengah",
    timeEstimate: "2 menit",
    keywords: ["komisi", "slippage", "biaya", "expectancy"],
  },
  {
    id: "crypto-fee",
    href: "/lab/crypto-fee",
    title: "Biaya Crypto & Funding Rate",
    shortTitle: "Biaya Crypto",
    description:
      "Hitung biaya maker/taker dan estimasi funding rate untuk posisi perpetual futures.",
    icon: Bitcoin,
    tag: "Kalkulator",
    category: "trading-mechanics",
    difficulty: "menengah",
    timeEstimate: "2 menit",
    keywords: ["crypto", "funding", "maker taker", "perpetual"],
  },
  {
    id: "volatility",
    href: "/lab/volatility",
    title: "Kalkulator Volatilitas",
    shortTitle: "Volatilitas",
    description:
      "Hitung volatilitas historis (annualized) dan estimasi implied volatility sederhana.",
    icon: Activity,
    tag: "Kalkulator",
    category: "technical",
    difficulty: "menengah",
    timeEstimate: "3 menit",
    keywords: ["volatilitas", "historical", "implied", "opsi"],
  },
  {
    id: "atr-trailing-stop",
    href: "/lab/atr-trailing-stop",
    title: "Trailing Stop Berbasis ATR",
    shortTitle: "ATR Trailing Stop",
    description:
      "Hitung level trailing stop dinamis dengan multiplier ATR yang dapat disesuaikan.",
    icon: TrendingDown,
    tag: "Kalkulator",
    category: "technical",
    difficulty: "menengah",
    timeEstimate: "2 menit",
    keywords: ["atr", "trailing stop", "stop loss"],
  },
  {
    id: "fibonacci",
    href: "/lab/fibonacci",
    title: "Fibonacci Retracement & Extension",
    shortTitle: "Fibonacci",
    description:
      "Hitung level retracement dan extension Fibonacci dari swing high/low.",
    icon: Sparkles,
    tag: "Kalkulator",
    category: "technical",
    difficulty: "pemula",
    timeEstimate: "2 menit",
    keywords: ["fibonacci", "retracement", "extension"],
  },
  {
    id: "r-multiple",
    href: "/lab/r-multiple",
    title: "Pelacak R-Multiple",
    shortTitle: "R-Multiple",
    description:
      "Catat dan analisis R-multiple per trade — rata-rata R, expectancy, dan distribusi hasil.",
    icon: Target,
    tag: "Tracker",
    category: "technical",
    featured: true,
    difficulty: "menengah",
    timeEstimate: "5 menit",
    keywords: ["r multiple", "journal", "statistik trade"],
  },
  {
    id: "portfolio-var",
    href: "/lab/portfolio-var",
    title: "Analisis Risiko Portofolio (VaR)",
    shortTitle: "Portfolio VaR",
    description:
      "Estimasi Value at Risk (VaR) untuk mengukur potensi kerugian maksimum portofolio trading.",
    icon: Shield,
    tag: "Analisis",
    category: "portfolio",
    difficulty: "lanjut",
    timeEstimate: "2 menit",
    keywords: ["var", "value at risk", "portofolio", "risiko"],
  },
  {
    id: "backtester",
    href: "/lab/backtester",
    title: "Backtester Aturan Sederhana",
    shortTitle: "Backtester",
    description:
      "Uji aturan MA crossover dan RSI oversold/overbought pada data harga historis.",
    icon: FlaskConical,
    tag: "Backtest",
    category: "backtesting",
    featured: true,
    difficulty: "lanjut",
    timeEstimate: "5 menit",
    keywords: ["backtest", "ma crossover", "rsi", "strategi"],
  },
];

export function getLabTool(id: string): LabTool | undefined {
  return labTools.find((tool) => tool.id === id);
}

export function getLabToolsByCategory(category: LabToolCategory): LabTool[] {
  return labTools.filter((tool) => tool.category === category);
}

export function getFeaturedLabTools(): LabTool[] {
  return labTools.filter((tool) => tool.featured);
}

export function searchLabTools(query: string): LabTool[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return labTools;

  return labTools.filter((tool) => {
    const haystack = [
      tool.title,
      tool.shortTitle ?? "",
      tool.description,
      tool.tag,
      tool.category,
      ...(tool.keywords ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export function getRelatedLabTools(toolId: string, limit = 3): LabTool[] {
  const current = getLabTool(toolId);
  if (!current) return [];

  return labTools
    .filter((tool) => tool.id !== toolId && tool.category === current.category)
    .slice(0, limit);
}

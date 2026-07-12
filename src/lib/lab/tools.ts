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

export type LabCategory = {
  id: LabToolCategory;
  title: string;
  description: string;
};

export const labCategories: LabCategory[] = [
  {
    id: "risk-money",
    title: "Risk & Money Management",
    description: "Ukuran posisi, breakeven, Kelly — semua yang kamu butuhkan sebelum entry.",
  },
  {
    id: "performance",
    title: "Performance & Probability",
    description: "Monte Carlo simulator dan ekspektasi trade dengan matriks win rate × R:R.",
  },
  {
    id: "trading-mechanics",
    title: "Trading Mechanics",
    description: "Pip value, lot size, margin, swap, komisi, slippage, dan biaya crypto.",
  },
  {
    id: "technical",
    title: "Technical & Market",
    description: "Volatilitas, ATR trailing stop, Fibonacci, dan R-multiple tracker.",
  },
  {
    id: "portfolio",
    title: "Portfolio & Advanced",
    description: "Analisis risiko portofolio trading multi-aset.",
  },
  {
    id: "backtesting",
    title: "Strategy Testing & Backtesting",
    description: "Uji aturan entry/exit sederhana pada data harga historis.",
  },
];

export type LabTool = {
  id: string;
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tag: string;
  category: LabToolCategory;
};

export const labTools: LabTool[] = [
  // ── Risk & Money Management ──
  {
    id: "position-size",
    href: "/lab/position-size",
    title: "Position Size Calculator",
    description:
      "Hitung ukuran posisi optimal berdasarkan % risiko per trade, stop loss, dan modal trading.",
    icon: Target,
    tag: "Kalkulator",
    category: "risk-money",
  },
  {
    id: "risk-reward",
    href: "/lab/risk-reward",
    title: "Risk-Reward Calculator",
    description:
      "Hitung rasio risk:reward, jarak stop loss & take profit, serta potensi untung/rugi per trade.",
    icon: Scale,
    tag: "Kalkulator",
    category: "risk-money",
  },
  {
    id: "breakeven",
    href: "/lab/breakeven",
    title: "Breakeven Price Calculator",
    description:
      "Hitung harga breakeven setelah memperhitungkan biaya komisi, spread, dan pajak.",
    icon: CircleDollarSign,
    tag: "Kalkulator",
    category: "risk-money",
  },
  {
    id: "kelly-criterion",
    href: "/lab/kelly-criterion",
    title: "Kelly Criterion Calculator",
    description:
      "Hitung fraksi Kelly optimal untuk menentukan proporsi modal yang seharusnya dipertaruhkan per trade.",
    icon: Percent,
    tag: "Kalkulator",
    category: "risk-money",
  },

  // ── Performance & Probability ──
  {
    id: "monte-carlo",
    href: "/lab/monte-carlo",
    title: "Monte Carlo Simulator",
    description:
      "Simulasikan ribuan skenario trading — probabilitas ruin, equity curve, max drawdown, dan distribusi saldo akhir.",
    icon: Dices,
    tag: "Simulasi",
    category: "performance",
  },
  {
    id: "trade-expectancy",
    href: "/lab/trade-expectancy",
    title: "Trade Expectancy Calculator",
    description:
      "Hitung ekspektasi per trade dan jelajahi matriks win rate × R:R untuk menilai kelayakan strategi.",
    icon: Sparkles,
    tag: "Kalkulator",
    category: "performance",
  },

  // ── Trading Mechanics ──
  {
    id: "floating-calculator",
    href: "/lab/floating-calculator",
    title: "Floating P/L Calculator",
    description:
      "Hitung floating profit/loss dari harga entry dan harga saat ini, atau cari harga target dari floating yang diinginkan.",
    icon: Gauge,
    tag: "Kalkulator",
    category: "trading-mechanics",
  },
  {
    id: "pip-value",
    href: "/lab/pip-value",
    title: "Pip & Point Value Calculator",
    description:
      "Hitung nilai per pip/point untuk forex dan indeks berdasarkan lot size, pair, dan kurs.",
    icon: Crosshair,
    tag: "Kalkulator",
    category: "trading-mechanics",
  },
  {
    id: "lot-size",
    href: "/lab/lot-size",
    title: "Lot Size / Contract Size",
    description:
      "Konversi antara lot standar/mini/mikro, unit kontrak, dan nilai nominal posisi.",
    icon: Layers,
    tag: "Kalkulator",
    category: "trading-mechanics",
  },
  {
    id: "margin-leverage",
    href: "/lab/margin-leverage",
    title: "Margin & Leverage Calculator",
    description:
      "Hitung margin requirement, buying power, dan dampak leverage pada posisi trading.",
    icon: Zap,
    tag: "Kalkulator",
    category: "trading-mechanics",
  },
  {
    id: "swap-rollover",
    href: "/lab/swap-rollover",
    title: "Swap / Rollover Fee Calculator",
    description:
      "Estimasi biaya swap/rollover harian untuk posisi forex berdasarkan lot size dan rate.",
    icon: RefreshCw,
    tag: "Kalkulator",
    category: "trading-mechanics",
  },
  {
    id: "commission-slippage",
    href: "/lab/commission-slippage",
    title: "Commission & Slippage Impact",
    description:
      "Ukur dampak komisi dan slippage terhadap ekspektasi profit dan break-even win rate.",
    icon: ArrowLeftRight,
    tag: "Kalkulator",
    category: "trading-mechanics",
  },
  {
    id: "crypto-fee",
    href: "/lab/crypto-fee",
    title: "Crypto Fee & Funding Rate",
    description:
      "Hitung biaya trading crypto (maker/taker) dan estimasi funding rate untuk posisi perpetual.",
    icon: Bitcoin,
    tag: "Kalkulator",
    category: "trading-mechanics",
  },

  // ── Technical & Market ──
  {
    id: "volatility",
    href: "/lab/volatility",
    title: "Volatility Calculator",
    description:
      "Hitung volatilitas historis (standar deviasi return) dan estimasi implied volatility sederhana.",
    icon: Activity,
    tag: "Kalkulator",
    category: "technical",
  },
  {
    id: "atr-trailing-stop",
    href: "/lab/atr-trailing-stop",
    title: "ATR Trailing Stop Calculator",
    description:
      "Hitung level trailing stop berbasis ATR dengan multiplier yang dapat disesuaikan.",
    icon: TrendingDown,
    tag: "Kalkulator",
    category: "technical",
  },
  {
    id: "fibonacci",
    href: "/lab/fibonacci",
    title: "Fibonacci Target & Extension",
    description:
      "Hitung level retracement dan extension Fibonacci dari swing high/low.",
    icon: Sparkles,
    tag: "Kalkulator",
    category: "technical",
  },
  {
    id: "r-multiple",
    href: "/lab/r-multiple",
    title: "R-Multiple Tracker",
    description:
      "Lacak dan hitung R-multiple per trade serta statistik agregat (avg R, expectancy, dll).",
    icon: Target,
    tag: "Tracker",
    category: "technical",
  },

  // ── Portfolio & Advanced ──
  {
    id: "portfolio-var",
    href: "/lab/portfolio-var",
    title: "Portfolio Risk Analyzer (VaR)",
    description:
      "Estimasi Value at Risk (VaR) untuk mengukur potensi kerugian maksimum portofolio trading.",
    icon: Shield,
    tag: "Analisis",
    category: "portfolio",
  },

  // ── Strategy Testing & Backtesting ──
  {
    id: "backtester",
    href: "/lab/backtester",
    title: "Simple Rule-Based Backtester",
    description:
      "Backtest aturan entry/exit sederhana (MA crossover, RSI) pada data harga historis.",
    icon: FlaskConical,
    tag: "Backtest",
    category: "backtesting",
  },
];

export function getLabTool(id: string): LabTool | undefined {
  return labTools.find((tool) => tool.id === id);
}

export function getLabToolsByCategory(category: LabToolCategory): LabTool[] {
  return labTools.filter((tool) => tool.category === category);
}

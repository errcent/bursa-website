import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Bitcoin,
  Calculator,
  Calendar,
  ChartLine,
  CircleDollarSign,
  Coins,
  Crosshair,
  Dices,
  FlaskConical,
  Gauge,
  GitBranch,
  Grid3x3,
  Landmark,
  Layers,
  LineChart,
  Percent,
  PieChart,
  RefreshCw,
  Scale,
  Shield,
  Sigma,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

export type LabToolCategory =
  | "risk-money"
  | "performance"
  | "valuation"
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
    description: "Kalkulator ukuran posisi, breakeven, drawdown, Kelly, dan manajemen risiko.",
  },
  {
    id: "performance",
    title: "Performance & Probability",
    description: "Simulasi performa, ekspektasi trade, probabilitas ruin, dan equity curve.",
  },
  {
    id: "valuation",
    title: "Valuation & Fundamental",
    description: "Model valuasi saham: DCF, DDM, Graham Number, PEG, dan proyeksi fundamental.",
  },
  {
    id: "trading-mechanics",
    title: "Trading Mechanics",
    description: "Pip value, lot size, margin, swap, komisi, slippage, dan biaya crypto.",
  },
  {
    id: "technical",
    title: "Technical & Market",
    description: "Volatilitas, ATR trailing stop, Fibonacci, R-multiple, korelasi, dan beta.",
  },
  {
    id: "portfolio",
    title: "Portfolio & Advanced",
    description: "VaR, alokasi aset, rebalancing, pajak, dan return disesuaikan inflasi.",
  },
  {
    id: "backtesting",
    title: "Strategy Testing & Backtesting",
    description: "Backtester sederhana, walk-forward, optimasi parameter, dan analisis musiman.",
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
    id: "risk-reward-matrix",
    href: "/lab/risk-reward-matrix",
    title: "Risk to Reward Expectancy Matrix",
    description:
      "Lihat matriks ekspektasi di berbagai kombinasi win rate dan rasio risk:reward untuk menilai kelayakan strategi.",
    icon: Grid3x3,
    tag: "Matriks",
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
    id: "max-drawdown",
    href: "/lab/max-drawdown",
    title: "Maximum Drawdown Simulator",
    description:
      "Simulasikan skenario drawdown maksimum berdasarkan win rate, R:R, dan jumlah trade.",
    icon: TrendingDown,
    tag: "Simulasi",
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
  {
    id: "optimal-f",
    href: "/lab/optimal-f",
    title: "Optimal F / Fixed Fractional",
    description:
      "Kalkulator Optimal F dan fixed fractional sizing untuk manajemen modal berbasis risiko.",
    icon: Sigma,
    tag: "Kalkulator",
    category: "risk-money",
  },

  // ── Performance & Probability ──
  {
    id: "monte-carlo",
    href: "/lab/monte-carlo",
    title: "Monte Carlo Simulator",
    description:
      "Simulasikan ribuan skenario trading acak untuk melihat rentang kemungkinan hasil akhir modal.",
    icon: Dices,
    tag: "Simulasi",
    category: "performance",
  },
  {
    id: "trade-expectancy",
    href: "/lab/trade-expectancy",
    title: "Trade Expectancy Calculator",
    description:
      "Hitung ekspektasi per trade dalam R-multiple dan nilai nominal berdasarkan win rate dan R:R.",
    icon: Sparkles,
    tag: "Kalkulator",
    category: "performance",
  },
  {
    id: "win-rate-scenario",
    href: "/lab/win-rate-scenario",
    title: "Win Rate vs R:R Analyzer",
    description:
      "Analisis skenario berbagai kombinasi win rate dan risk:reward untuk mencapai target profit.",
    icon: SlidersHorizontal,
    tag: "Analisis",
    category: "performance",
  },
  {
    id: "ruin-probability",
    href: "/lab/ruin-probability",
    title: "Ruin Probability Calculator",
    description:
      "Estimasi probabilitas kebangkrutan (ruin) berdasarkan win rate, payoff ratio, dan risiko per trade.",
    icon: Shield,
    tag: "Kalkulator",
    category: "performance",
  },
  {
    id: "equity-curve",
    href: "/lab/equity-curve",
    title: "Equity Curve Simulator",
    description:
      "Visualisasikan kurva ekuitas dari serangkaian trade berdasarkan win rate, R:R, dan risiko per trade.",
    icon: ChartLine,
    tag: "Simulasi",
    category: "performance",
  },
  {
    id: "trade-sequence",
    href: "/lab/trade-sequence",
    title: "Trade Sequence Simulator",
    description:
      "Simulasi random walk urutan trade berdasarkan win rate dan R:R untuk melihat variasi hasil.",
    icon: GitBranch,
    tag: "Simulasi",
    category: "performance",
  },

  // ── Valuation & Fundamental ──
  {
    id: "fair-value",
    href: "/lab/fair-value",
    title: "Fair Value Stock Calculator",
    description:
      "Estimasi nilai wajar saham dengan model DCF sederhana (pertumbuhan EPS) atau pendekatan P/E pembanding.",
    icon: Calculator,
    tag: "Kalkulator",
    category: "valuation",
  },
  {
    id: "ddm",
    href: "/lab/ddm",
    title: "Dividend Discount Model",
    description:
      "Valuasi saham berbasis dividen dengan model Gordon Growth (DDM) dan multi-stage growth.",
    icon: Coins,
    tag: "Kalkulator",
    category: "valuation",
  },
  {
    id: "graham-number",
    href: "/lab/graham-number",
    title: "Graham Number Calculator",
    description:
      "Hitung Graham Number — batas harga wajar menurut Benjamin Graham berdasarkan EPS dan book value.",
    icon: Landmark,
    tag: "Kalkulator",
    category: "valuation",
  },
  {
    id: "peg-ratio",
    href: "/lab/peg-ratio",
    title: "PEG Ratio Analyzer",
    description:
      "Analisis rasio PEG (P/E to Growth) untuk menilai apakah saham undervalued atau overvalued.",
    icon: TrendingUp,
    tag: "Analisis",
    category: "valuation",
  },
  {
    id: "roe-roic",
    href: "/lab/roe-roic",
    title: "ROE / ROIC Projector",
    description:
      "Proyeksikan ROE dan ROIC masa depan berdasarkan margin, turnover, dan leverage (DuPont).",
    icon: BarChart3,
    tag: "Proyeksi",
    category: "valuation",
  },
  {
    id: "earnings-growth",
    href: "/lab/earnings-growth",
    title: "Earnings Growth Projector",
    description:
      "Proyeksikan pertumbuhan laba (EPS) berdasarkan revenue growth, margin, dan buyback/dividen.",
    icon: LineChart,
    tag: "Proyeksi",
    category: "valuation",
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
  {
    id: "correlation-matrix",
    href: "/lab/correlation-matrix",
    title: "Correlation Matrix",
    description:
      "Hitung matriks korelasi antar aset dari data return untuk analisis diversifikasi.",
    icon: Grid3x3,
    tag: "Analisis",
    category: "technical",
  },
  {
    id: "beta-calculator",
    href: "/lab/beta-calculator",
    title: "Beta Calculator",
    description:
      "Hitung beta saham terhadap indeks pasar dari data return untuk mengukur sensitivitas sistematis.",
    icon: BarChart3,
    tag: "Kalkulator",
    category: "technical",
  },

  // ── Portfolio & Advanced ──
  {
    id: "portfolio-var",
    href: "/lab/portfolio-var",
    title: "Portfolio Risk Analyzer (VaR)",
    description:
      "Estimasi Value at Risk (VaR) sederhana untuk portofolio multi-aset.",
    icon: Shield,
    tag: "Analisis",
    category: "portfolio",
  },
  {
    id: "asset-allocation",
    href: "/lab/asset-allocation",
    title: "Asset Allocation Optimizer",
    description:
      "Optimasi alokasi aset sederhana berdasarkan expected return, volatilitas, dan korelasi.",
    icon: PieChart,
    tag: "Optimizer",
    category: "portfolio",
  },
  {
    id: "rebalancing",
    href: "/lab/rebalancing",
    title: "Rebalancing Calculator",
    description:
      "Hitung jumlah jual/beli yang diperlukan untuk rebalance portofolio ke target alokasi.",
    icon: RefreshCw,
    tag: "Kalkulator",
    category: "portfolio",
  },
  {
    id: "tax-impact",
    href: "/lab/tax-impact",
    title: "Tax Impact Simulator",
    description:
      "Simulasikan dampak pajak capital gain (final/dividen) terhadap return bersih portofolio.",
    icon: Wallet,
    tag: "Simulasi",
    category: "portfolio",
  },
  {
    id: "inflation-adjusted",
    href: "/lab/inflation-adjusted",
    title: "Inflation Adjusted Return",
    description:
      "Konversi nominal return ke real return setelah disesuaikan dengan tingkat inflasi.",
    icon: TrendingUp,
    tag: "Kalkulator",
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
  {
    id: "walk-forward",
    href: "/lab/walk-forward",
    title: "Walk-Forward Analysis",
    description:
      "Analisis walk-forward untuk menguji robustnes parameter strategi di periode in-sample vs out-of-sample.",
    icon: ArrowLeftRight,
    tag: "Analisis",
    category: "backtesting",
  },
  {
    id: "parameter-optimization",
    href: "/lab/parameter-optimization",
    title: "Parameter Optimization Simulator",
    description:
      "Grid search parameter strategi untuk menemukan kombinasi optimal berdasarkan metrik performa.",
    icon: SlidersHorizontal,
    tag: "Simulasi",
    category: "backtesting",
  },
  {
    id: "seasonality",
    href: "/lab/seasonality",
    title: "Seasonality Analyzer",
    description:
      "Analisis pola musiman (January Effect, dll) dari data return bulanan historis.",
    icon: Calendar,
    tag: "Analisis",
    category: "backtesting",
  },
];

export function getLabTool(id: string): LabTool | undefined {
  return labTools.find((tool) => tool.id === id);
}

export function getLabToolsByCategory(category: LabToolCategory): LabTool[] {
  return labTools.filter((tool) => tool.category === category);
}

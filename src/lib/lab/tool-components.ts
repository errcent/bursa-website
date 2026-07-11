import type { ComponentType } from "react";

import { FairValueCalculator } from "@/components/lab/fair-value-calculator";
import { FloatingCalculator } from "@/components/lab/floating-calculator";
import { MonteCarloSimulator } from "@/components/lab/monte-carlo-simulator";
import { RiskRewardMatrix } from "@/components/lab/risk-reward-matrix";
import {
  BacktesterTool,
  ParameterOptimizationTool,
  SeasonalityAnalyzer,
  WalkForwardTool,
} from "@/components/lab/tools/backtesting";
import {
  EquityCurveSimulator,
  RuinProbabilityCalculator,
  TradeExpectancyCalculator,
  TradeSequenceSimulator,
  WinRateScenarioAnalyzer,
} from "@/components/lab/tools/performance";
import {
  AssetAllocationOptimizer,
  InflationAdjustedCalculator,
  PortfolioVarCalculator,
  RebalancingCalculator,
  TaxImpactSimulator,
} from "@/components/lab/tools/portfolio";
import {
  BreakevenCalculator,
  KellyCriterionCalculator,
  MaxDrawdownSimulator,
  OptimalFCalculator,
  PositionSizeCalculator,
  RiskRewardCalculator,
} from "@/components/lab/tools/risk-money";
import {
  AtrTrailingStopCalculator,
  BetaCalculatorTool,
  CorrelationMatrixTool,
  FibonacciCalculator,
  RMultipleTracker,
  VolatilityCalculator,
} from "@/components/lab/tools/technical";
import {
  CommissionSlippageCalculator,
  CryptoFeeCalculator,
  LotSizeCalculator,
  MarginLeverageCalculator,
  PipValueCalculator,
  SwapRolloverCalculator,
} from "@/components/lab/tools/trading-mechanics";
import {
  DdmCalculator,
  EarningsGrowthProjector,
  GrahamNumberCalculator,
  PegRatioAnalyzer,
  RoeRoicProjector,
} from "@/components/lab/tools/valuation";

export type LabToolConfig = {
  component: ComponentType;
  assumptions: string[];
};

export const labToolConfigs: Record<string, LabToolConfig> = {
  "position-size": {
    component: PositionSizeCalculator,
    assumptions: [
      "Ukuran posisi dihitung agar kerugian maksimum jika stop loss tersentuh sama dengan % risiko yang ditentukan.",
      "Tidak memperhitungkan slippage, spread, atau komisi — tambahkan buffer manual jika perlu.",
    ],
  },
  "risk-reward": {
    component: RiskRewardCalculator,
    assumptions: [
      "R:R dihitung sebagai jarak take profit dibagi jarak stop loss dari entry.",
      "Potensi untung/rugi nominal bergantung pada ukuran posisi yang dimasukkan.",
    ],
  },
  "risk-reward-matrix": {
    component: RiskRewardMatrix,
    assumptions: [
      "Expectancy (R) = (Win rate × R:R) − (1 − Win rate). Nilai positif berarti strategi profitable secara matematis.",
      "Matriks ini tidak memperhitungkan biaya trading, slippage, atau variasi ukuran posisi.",
    ],
  },
  breakeven: {
    component: BreakevenCalculator,
    assumptions: [
      "Breakeven = harga di mana profit kotor menutup semua biaya (komisi, spread, pajak).",
      "Pajak dihitung sebagai % dari gain, bukan dari total transaksi.",
    ],
  },
  "max-drawdown": {
    component: MaxDrawdownSimulator,
    assumptions: [
      "Simulasi menggunakan fixed fractional risk per trade dengan R-multiple tetap.",
      "Hasil bervariasi setiap run karena menggunakan random number generator.",
    ],
  },
  "kelly-criterion": {
    component: KellyCriterionCalculator,
    assumptions: [
      "Kelly penuh sering terlalu agresif untuk trading nyata — half/quarter Kelly lebih umum dipakai.",
      "Asumsi win rate dan R:R stabil dan independen antar trade.",
    ],
  },
  "optimal-f": {
    component: OptimalFCalculator,
    assumptions: [
      "Optimal F (Ralph Vince) memaksimalkan terminal wealth return dari serangkaian trade historis.",
      "Fixed fractional adalah alternatif sederhana dengan fraksi tetap dari modal.",
    ],
  },
  "monte-carlo": {
    component: MonteCarloSimulator,
    assumptions: [
      "Setiap trade dianggap independen dengan probabilitas dan ukuran untung/rugi tetap.",
      "Simulasi berjalan di browser — semakin besar parameter, semakin lama waktu hitung.",
    ],
  },
  "trade-expectancy": {
    component: TradeExpectancyCalculator,
    assumptions: [
      "Expectancy dihitung dalam R-multiple dan dikonversi ke nominal berdasarkan risiko per trade.",
      "Profit factor = gross profit / gross loss.",
    ],
  },
  "win-rate-scenario": {
    component: WinRateScenarioAnalyzer,
    assumptions: [
      "Menampilkan skenario win rate dan R:R yang mendekati target return.",
      "Breakeven win rate dihitung dari formula 1 / (1 + R:R).",
    ],
  },
  "ruin-probability": {
    component: RuinProbabilityCalculator,
    assumptions: [
      "Menggunakan formula probabilitas ruin klasik untuk fixed fractional betting.",
      "Jika edge ≤ 0 (expectancy negatif), probabilitas ruin mendekati 100%.",
    ],
  },
  "equity-curve": {
    component: EquityCurveSimulator,
    assumptions: [
      "Kurva ekuitas dihasilkan dari simulasi random trade dengan parameter tetap.",
      "Setiap klik 'Simulasikan' menghasilkan urutan trade yang berbeda.",
    ],
  },
  "trade-sequence": {
    component: TradeSequenceSimulator,
    assumptions: [
      "Random walk berdasarkan win rate dan R:R — setiap trade independen.",
      "W = win (+R:R), L = loss (−1R).",
    ],
  },
  "fair-value": {
    component: FairValueCalculator,
    assumptions: [
      "DCF menggunakan model pertumbuhan EPS sederhana, bukan full discounted cash flow.",
      "P/E relatif membandingkan dengan peer average — bukan analisis fundamental lengkap.",
    ],
  },
  ddm: {
    component: DdmCalculator,
    assumptions: [
      "Gordon Growth Model: P = D₁ / (r − g). Syarat: discount rate > growth rate.",
      "Multi-stage DDM menggunakan fase high growth lalu terminal value dengan stable growth.",
    ],
  },
  "graham-number": {
    component: GrahamNumberCalculator,
    assumptions: [
      "Graham Number = √(22.5 × EPS × BVPS). Hanya berlaku jika EPS dan BVPS positif.",
      "Merupakan batas atas harga wajar menurut Benjamin Graham, bukan target harga.",
    ],
  },
  "peg-ratio": {
    component: PegRatioAnalyzer,
    assumptions: [
      "PEG = P/E ÷ Earnings Growth Rate. PEG < 1 umumnya dianggap undervalued.",
      "Growth rate harus positif agar PEG bermakna.",
    ],
  },
  "roe-roic": {
    component: RoeRoicProjector,
    assumptions: [
      "ROE didekomposisi via DuPont: Margin × Turnover × Leverage.",
      "Proyeksi menggunakan asumsi perubahan linear sederhana per tahun.",
    ],
  },
  "earnings-growth": {
    component: EarningsGrowthProjector,
    assumptions: [
      "EPS proyeksi = EPS × (1 + revenue growth + margin improvement − share dilution).",
      "Model sederhana — tidak memperhitungkan siklus bisnis atau one-time items.",
    ],
  },
  "floating-calculator": {
    component: FloatingCalculator,
    assumptions: [
      "Floating % dihitung dari selisih harga entry vs harga saat ini, disesuaikan arah long/short.",
      "Estimasi pip bersifat opsional dan bergantung pada ukuran pip yang dimasukkan.",
    ],
  },
  "pip-value": {
    component: PipValueCalculator,
    assumptions: [
      "Nilai pip = pip size × lot size × contract size ÷ exchange rate.",
      "Untuk pair non-USD quote, sesuaikan exchange rate.",
    ],
  },
  "lot-size": {
    component: LotSizeCalculator,
    assumptions: [
      "1 standard lot = 100,000 units. Mini = 0.1 lot, Micro = 0.01 lot.",
      "Konversi standar forex — kontrak lain (gold, index) mungkin berbeda.",
    ],
  },
  "margin-leverage": {
    component: MarginLeverageCalculator,
    assumptions: [
      "Margin = Position Value ÷ Leverage.",
      "Tidak memperhitungkan maintenance margin atau margin call level.",
    ],
  },
  "swap-rollover": {
    component: SwapRolloverCalculator,
    assumptions: [
      "Swap dihitung per lot per malam berdasarkan rate yang dimasukkan.",
      "Triple swap pada hari Rabu tidak diperhitungkan secara otomatis.",
    ],
  },
  "commission-slippage": {
    component: CommissionSlippageCalculator,
    assumptions: [
      "Biaya trading mengurangi expectancy dalam satuan R-multiple.",
      "Breakeven win rate disesuaikan dengan total biaya per trade.",
    ],
  },
  "crypto-fee": {
    component: CryptoFeeCalculator,
    assumptions: [
      "Funding rate dihitung per periode 8 jam (standar perpetual futures).",
      "Entry fee menggunakan maker rate, exit fee menggunakan taker rate.",
    ],
  },
  volatility: {
    component: VolatilityCalculator,
    assumptions: [
      "Historical vol = standar deviasi log-return × √(252), dalam %.",
      "Implied vol menggunakan aproksimasi Brenner-Subrahmanyam, bukan Black-Scholes penuh.",
    ],
  },
  "atr-trailing-stop": {
    component: AtrTrailingStopCalculator,
    assumptions: [
      "Stop level = Harga ± (ATR × Multiplier).",
      "Trailing stop sebenarnya bergerak mengikuti harga — ini menghitung level saat ini saja.",
    ],
  },
  fibonacci: {
    component: FibonacciCalculator,
    assumptions: [
      "Retracement dihitung dari swing high ke swing low.",
      "Extension melanjutkan range di atas swing high.",
    ],
  },
  "r-multiple": {
    component: RMultipleTracker,
    assumptions: [
      "Masukkan hasil trade dalam satuan R (1R = risiko awal per trade).",
      "Statistik agregat dihitung dari seluruh trade yang dimasukkan.",
    ],
  },
  "correlation-matrix": {
    component: CorrelationMatrixTool,
    assumptions: [
      "Korelasi Pearson dari serangkaian return periodik (harian, mingguan, bulanan).",
      "Minimal 2 data point per aset untuk korelasi bermakna.",
    ],
  },
  "beta-calculator": {
    component: BetaCalculatorTool,
    assumptions: [
      "Beta = Cov(stock, market) / Var(market) dari return periodik.",
      "Beta > 1 = lebih volatil dari pasar, < 1 = kurang volatil.",
    ],
  },
  "portfolio-var": {
    component: PortfolioVarCalculator,
    assumptions: [
      "VaR parametric menggunakan asumsi distribusi normal.",
      "Z-score: 90% = 1.282, 95% = 1.645, 99% = 2.326.",
    ],
  },
  "asset-allocation": {
    component: AssetAllocationOptimizer,
    assumptions: [
      "Minimum variance portfolio untuk 2 aset menggunakan Markowitz sederhana.",
      "Tidak memperhitungkan expected return — fokus minimisasi volatilitas.",
    ],
  },
  rebalancing: {
    component: RebalancingCalculator,
    assumptions: [
      "Menghitung selisih nilai saat ini vs target alokasi per aset.",
      "Tidak memperhitungkan biaya transaksi rebalancing.",
    ],
  },
  "tax-impact": {
    component: TaxImpactSimulator,
    assumptions: [
      "Pajak capital gain dihitung dari gain kotor (hanya jika positif).",
      "Menggunakan tarif final — bukan progresif.",
    ],
  },
  "inflation-adjusted": {
    component: InflationAdjustedCalculator,
    assumptions: [
      "Real return = (1 + nominal) / (1 + inflasi) − 1 (Fisher equation).",
      "Proyeksi nilai akhir menggunakan compound real return.",
    ],
  },
  backtester: {
    component: BacktesterTool,
    assumptions: [
      "Backtester sederhana: MA crossover dan RSI oversold/overbought.",
      "Tidak memperhitungkan biaya trading, slippage, atau look-ahead bias.",
      "Gunakan data sample atau paste data harga sendiri.",
    ],
  },
  "walk-forward": {
    component: WalkForwardTool,
    assumptions: [
      "Optimasi parameter di in-sample, validasi di out-of-sample.",
      "Perbedaan besar antara in/out-of-sample mengindikasikan overfitting.",
    ],
  },
  "parameter-optimization": {
    component: ParameterOptimizationTool,
    assumptions: [
      "Grid search semua kombinasi fast/slow MA pada data sample.",
      "Ranking berdasarkan Sharpe ratio — bukan total return saja.",
    ],
  },
  seasonality: {
    component: SeasonalityAnalyzer,
    assumptions: [
      "Analisis rata-rata return dan win rate per bulan kalender.",
      "Pola musiman historis tidak menjamin pengulangan di masa depan.",
    ],
  },
};

export function getLabToolConfig(id: string): LabToolConfig | undefined {
  return labToolConfigs[id];
}

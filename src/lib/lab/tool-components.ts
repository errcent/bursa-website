import type { ComponentType } from "react";

import { FloatingCalculator } from "@/components/lab/floating-calculator";
import { MonteCarloSimulator } from "@/components/lab/monte-carlo-simulator";
import { BacktesterTool } from "@/components/lab/tools/backtesting";
import { TradeExpectancyCalculator } from "@/components/lab/tools/performance";
import { PortfolioVarCalculator } from "@/components/lab/tools/portfolio";
import {
  BreakevenCalculator,
  KellyCriterionCalculator,
  PositionSizeCalculator,
  RiskRewardCalculator,
} from "@/components/lab/tools/risk-money";
import {
  AtrTrailingStopCalculator,
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
  breakeven: {
    component: BreakevenCalculator,
    assumptions: [
      "Breakeven = harga di mana profit kotor menutup semua biaya (komisi, spread, pajak).",
      "Pajak dihitung sebagai % dari gain, bukan dari total transaksi.",
    ],
  },
  "kelly-criterion": {
    component: KellyCriterionCalculator,
    assumptions: [
      "Kelly penuh sering terlalu agresif untuk trading nyata — half/quarter Kelly lebih umum dipakai.",
      "Asumsi win rate dan R:R stabil dan independen antar trade.",
    ],
  },
  "monte-carlo": {
    component: MonteCarloSimulator,
    assumptions: [
      "Setiap trade dianggap independen dengan probabilitas dan ukuran untung/rugi tetap.",
      "Probabilitas ruin = persentase simulasi yang berakhir dengan saldo ≤ 1% modal awal.",
      "Equity curve menampilkan satu jalur acak sebagai contoh, bukan rata-rata semua simulasi.",
      "Max drawdown dihitung dari jalur contoh yang sama dengan equity curve.",
      "Simulasi berjalan di browser — semakin besar parameter, semakin lama waktu hitung.",
    ],
  },
  "trade-expectancy": {
    component: TradeExpectancyCalculator,
    assumptions: [
      "Expectancy dihitung dalam R-multiple dan dikonversi ke nominal berdasarkan risiko per trade.",
      "Matriks: Expectancy (R) = (Win rate × R:R) − (1 − Win rate). Nilai positif berarti strategi profitable secara matematis.",
      "Profit factor = gross profit / gross loss.",
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
  "portfolio-var": {
    component: PortfolioVarCalculator,
    assumptions: [
      "VaR parametric menggunakan asumsi distribusi normal.",
      "Z-score: 90% = 1.282, 95% = 1.645, 99% = 2.326.",
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
};

export function getLabToolConfig(id: string): LabToolConfig | undefined {
  return labToolConfigs[id];
}

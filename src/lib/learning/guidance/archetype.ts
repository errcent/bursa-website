import type { ProfileAnalysis } from "@/lib/learning/guidance/scoring";
import type { LearningGuidanceAnswers } from "@/lib/learning/guidance/types";

/** Internal segment label; not shown to learners. */
export type GuidanceArchetype =
  | "cautious_foundation"
  | "steady_builder"
  | "active_scalper"
  | "swing_operator"
  | "long_horizon_investor"
  | "crypto_explorer"
  | "forex_macro_reader"
  | "side_hustle_learner"
  | "wealth_compounder"
  | "retirement_planner"
  | "advanced_refiner"
  | "risk_aware_starter";

function isBeginner(experience: LearningGuidanceAnswers["experience"]): boolean {
  return experience === "never" || experience === "demo";
}

export function deriveGuidanceArchetype(
  answers: LearningGuidanceAnswers,
  profile: ProfileAnalysis
): GuidanceArchetype {
  if (answers.learningGap === "emotional_control") return "risk_aware_starter";
  if (answers.learningGap === "no_foundation") return "cautious_foundation";
  if (answers.learningGap === "ready_for_depth" && answers.experience !== "never") {
    return answers.experience === "profitable" ? "advanced_refiner" : "steady_builder";
  }

  if (answers.experience === "profitable") return "advanced_refiner";

  if (answers.instrument === "Crypto" && isBeginner(answers.experience)) {
    return answers.riskTolerance === "conservative" ? "risk_aware_starter" : "crypto_explorer";
  }

  if (answers.instrument === "Forex" && answers.tradingStyle !== "scalping") {
    return "forex_macro_reader";
  }

  if (answers.goal === "retirement") return "retirement_planner";
  if (answers.goal === "wealth" && !isBeginner(answers.experience)) return "wealth_compounder";
  if (answers.goal === "side_income") return "side_hustle_learner";

  if (answers.tradingStyle === "scalping" || answers.tradingStyle === "day_trading") {
    return "active_scalper";
  }

  if (answers.tradingStyle === "long_term") return "long_horizon_investor";
  if (answers.tradingStyle === "swing") return "swing_operator";

  if (answers.riskTolerance === "conservative" || answers.goal === "basics") {
    return isBeginner(answers.experience) ? "cautious_foundation" : "steady_builder";
  }

  if (profile.pace === "deep") return "steady_builder";
  return "risk_aware_starter";
}

/** Optional narrative nuance keyed by archetype (still natural language). */
export function archetypeNarrativeHint(archetype: GuidanceArchetype): string | null {
  const hints: Partial<Record<GuidanceArchetype, string>> = {
    cautious_foundation: "Prioritas utamamu membangun fondasi aman sebelum eksekusi.",
    active_scalper: "Ritme belajar perlu ringkas dan langsung terapkan di sesi pasar.",
    side_hustle_learner: "Belajar di sela rutinitas. Rekomendasi di bawah disesuaikan dengan waktu terbatas.",
    retirement_planner: "Fokus stabilitas dan disiplin jangka panjang.",
    risk_aware_starter: "Langkah awal yang menekankan manajemen risiko dulu.",
  };
  return hints[archetype] ?? null;
}

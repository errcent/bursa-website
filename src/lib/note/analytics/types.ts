import type { BehaviorRiskWeights } from "@/lib/note/playbook/types";
import type { SliceStat } from "@/lib/note/stats";

export type AnalyticsTab = "edge" | "losses" | "context" | "behavior" | "suggestions";

export type ContextZone = "high" | "neutral" | "avoid";

export type EdgeRow = SliceStat & { label: string };

export type LeakagePattern = {
  id: string;
  title: Record<"id" | "en", string>;
  detail: Record<"id" | "en", string>;
  severity: "high" | "med" | "low";
  net: number;
  count: number;
};

export type ContextCell = {
  key: string;
  label: Record<"id" | "en", string>;
  zone: ContextZone;
  net: number;
  count: number;
  winRate: number | null;
};

export type BehaviorDrift = {
  metric: Record<"id" | "en", string>;
  recent: string;
  prior: string;
  direction: "better" | "worse" | "flat";
};

export type PlaybookSuggestion = {
  id: string;
  title: Record<"id" | "en", string>;
  detail: Record<"id" | "en", string>;
  /** Patch keys for playbook rules/profile signals */
  patch: {
    rules?: Partial<import("@/lib/note/playbook/types").PlaybookRulesConfig>;
    signal?: Partial<import("@/lib/note/playbook/types").BehaviorSignals>;
  };
};

export type AnalyticsReport = {
  sampleClosed: number;
  focus: "overtrade" | "hesitation" | "balanced";
  edge: {
    symbols: EdgeRow[];
    sessions: EdgeRow[];
    assets: EdgeRow[];
    headline: Record<"id" | "en", string>;
  };
  leakage: LeakagePattern[];
  context: ContextCell[];
  drift: BehaviorDrift[];
  suggestions: PlaybookSuggestion[];
  weights: BehaviorRiskWeights | null;
};

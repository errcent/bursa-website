export type NoteBeliefTag =
  | "trade_idea"
  | "market_observation"
  | "emotion_psych"
  | "macro_news"
  | "setup_hypothesis";

export type BeliefLink = {
  journalEntryId?: string;
  playbookSetupId?: string;
};

export type BeliefPromotion = {
  id: string;
  kind: "playbook_candidate" | "risk_warning" | "analytics_pattern" | "unexecuted_idea";
  title: Record<"id" | "en", string>;
  detail: Record<"id" | "en", string>;
  href?: string;
  /** Playbook adopt: repeated belief snippet to commit as setup rule. */
  beliefSnippet?: string;
};
